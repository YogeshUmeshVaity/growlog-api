import {
  BadRequestException,
  ConflictException,
  NotFoundException
} from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { Test, TestingModule } from '@nestjs/testing'
import { QueryFailedError } from 'typeorm'
import {
  validCode as validCode,
  validRecovery,
  codeWithInvalidUsername,
  expiredRecovery
} from '../../test/password-recovery/fixtures/validate-code.fixtures'
import {
  googleUserWithRecovery,
  sampleRecoveryEmail as sampleEmail,
  userWithRecovery
} from '../../test/password-recovery/fixtures/recover-password.fixtures'
import { userWithCorrectInfo } from '../../test/users/fixtures/sign-up.fixtures'
import { EmailService } from '../email-service/email.service'
import { PasswordRecoveryRepository } from '../password-recovery/password-recovery.repository'
import { UsersRepository } from '../users/users.repository'
import { PasswordRecoveryService } from './password-recovery.service'

describe('PasswordRecoveryService', () => {
  let passwordRecoveryService: PasswordRecoveryService
  let emailService: EmailService
  let usersRepository: UsersRepository
  let passwordRecoveryRepository: PasswordRecoveryRepository

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PasswordRecoveryService,
        usersRepositoryMock(),
        passwordRecoveryRepositoryMock(),
        emailServiceMock(),
        ConfigService
      ]
    }).compile()

    usersRepository = module.get<UsersRepository>(UsersRepository)
    emailService = module.get<EmailService>(EmailService)
    passwordRecoveryService = module.get<PasswordRecoveryService>(
      PasswordRecoveryService
    )
    passwordRecoveryRepository = module.get<PasswordRecoveryRepository>(
      PasswordRecoveryRepository
    )
  })

  it('should be defined', () => {
    expect(passwordRecoveryService).toBeDefined()
  })

  describe(`recover`, () => {
    it(`should send a recovery email.`, async () => {
      await passwordRecoveryService.recover(sampleEmail)
      expect(emailService.sendEmail).toBeCalled()
    })

    it(`should notify the user that an email has been sent.`, async () => {
      const response = await passwordRecoveryService.recover(sampleEmail)
      expect(response).toEqual(
        'A password reset link has been sent to your email.'
      )
    })

    it(`should throw when no user is found by the given email.`, async () => {
      usersRepository.findByEmailWithRecovery = jest
        .fn()
        .mockResolvedValue(null)
      expect.assertions(2)
      try {
        await passwordRecoveryService.recover(sampleEmail)
      } catch (error) {
        expect(error).toBeInstanceOf(NotFoundException)
        expect(error).toHaveProperty(
          'message',
          `There's no user by this email.`
        )
      }
    })

    it(`should throw when the user was logged in using their Google account.`, async () => {
      // mock a Google user
      usersRepository.findByEmailWithRecovery = jest
        .fn()
        .mockResolvedValue(googleUserWithRecovery())

      expect.assertions(2)
      try {
        await passwordRecoveryService.recover(sampleEmail)
      } catch (error) {
        expect(error).toBeInstanceOf(BadRequestException)
        expect(error).toHaveProperty(
          'message',
          `You had previously logged in using Google. Please login using Google.`
        )
      }
    })

    it(`should delete the previous recovery when it exists.`, async () => {
      usersRepository.findByEmailWithRecovery = jest
        .fn()
        .mockResolvedValue(userWithRecovery())
      await passwordRecoveryService.recover(sampleEmail)
      expect(passwordRecoveryRepository.delete).toBeCalled()
    })

    it(`should throw when some other user already has the newly generated code.`, async () => {
      // We are concerned only with the type of error, so we pass any parameters to it.
      passwordRecoveryRepository.create = jest
        .fn()
        .mockRejectedValue(
          new QueryFailedError('SomeQuery', ['SomeParams'], 'SomeDriverError')
        )

      expect.assertions(2)
      try {
        await passwordRecoveryService.recover(sampleEmail)
      } catch (error) {
        expect(error).toBeInstanceOf(ConflictException)
        expect(error).toHaveProperty(
          'message',
          `Something went wrong. Please try again.`
        )
      }
    })
  })

  describe(`validateCode`, () => {
    it(`should return the same username and recovery code when code is valid.`, async () => {
      const validatedCode = await passwordRecoveryService.validateCode(
        validCode
      )
      expect(validatedCode.username).toEqual(validCode.username)
      expect(validatedCode.recoveryCode).toEqual(validCode.recoveryCode)
    })

    it(`should throw when the given recovery code is not found in database.`, async () => {
      passwordRecoveryRepository.findByCode = jest.fn().mockResolvedValue(null) // code not found
      expect.assertions(2)
      try {
        await passwordRecoveryService.validateCode(validCode)
      } catch (error) {
        expect(error).toBeInstanceOf(NotFoundException)
        expect(error).toHaveProperty('message', `Code not found.`)
      }
    })

    it(`should throw when the username doesn't match the one in the database.`, async () => {
      expect.assertions(2)
      try {
        await passwordRecoveryService.validateCode(codeWithInvalidUsername)
      } catch (error) {
        expect(error).toBeInstanceOf(NotFoundException)
        expect(error).toHaveProperty('message', `Code not found.`)
      }
    })

    it(`should throw when the given recovery code is expired.`, async () => {
      passwordRecoveryRepository.findByCode = jest
        .fn()
        .mockResolvedValue(expiredRecovery())

      expect.assertions(2)
      try {
        await passwordRecoveryService.validateCode(validCode)
      } catch (error) {
        expect(error).toBeInstanceOf(NotFoundException)
        expect(error).toHaveProperty(
          'message',
          `The recovery code has expired.`
        )
      }
    })

    it(`should delete the given recovery code when it is expired.`, async () => {
      const expiredPasswordRecovery = expiredRecovery()
      // must copy object, otherwise tokenInvalidator on the user object will be different
      const userWithDeletedRecovery = { ...expiredPasswordRecovery.user }
      // backup recovery object from user object before deleting
      const recoveryToDelete = userWithDeletedRecovery.passwordRecovery
      // now delete the recovery object from user object
      userWithDeletedRecovery.passwordRecovery = null

      passwordRecoveryRepository.findByCode = jest
        .fn()
        .mockResolvedValue(expiredPasswordRecovery)

      expect.assertions(2)
      try {
        await passwordRecoveryService.validateCode(validCode)
      } catch (error) {
        expect(usersRepository.update).toBeCalledWith(userWithDeletedRecovery)
        expect(passwordRecoveryRepository.delete).toBeCalledWith(
          recoveryToDelete
        )
      }
    })
  })
})

function passwordRecoveryRepositoryMock() {
  return {
    provide: PasswordRecoveryRepository,
    useValue: {
      delete: jest.fn().mockResolvedValue({}),
      create: jest.fn().mockResolvedValue(validRecovery()),
      findByCode: jest.fn().mockResolvedValue(validRecovery())
    }
  }
}

function emailServiceMock() {
  return {
    provide: EmailService,
    useValue: {
      sendEmail: jest.fn().mockResolvedValue({})
    }
  }
}

function usersRepositoryMock() {
  return {
    provide: UsersRepository,
    useValue: {
      findByEmail: jest.fn().mockResolvedValue(undefined),
      findByEmailWithRecovery: jest.fn().mockResolvedValue(userWithRecovery()),
      findByName: jest.fn().mockResolvedValue(undefined),
      findById: jest.fn().mockResolvedValue(userWithRecovery()),
      findByGoogleId: jest.fn().mockResolvedValue(userWithRecovery()),
      createLocalUser: jest.fn().mockResolvedValue(userWithCorrectInfo),
      createGoogleUser: jest.fn().mockResolvedValue(userWithRecovery()),
      updateEmail: jest.fn(),
      updateUsername: jest.fn().mockResolvedValue({}),
      updatePassword: jest.fn().mockResolvedValue({}),
      update: jest.fn()
    }
  }
}
