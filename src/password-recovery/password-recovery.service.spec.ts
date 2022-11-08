import {
  BadRequestException,
  ConflictException,
  NotFoundException,
  UnauthorizedException
} from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { Test, TestingModule } from '@nestjs/testing'
import { QueryFailedError } from 'typeorm'
import { EmptyLogger } from '../../test/common-mocks/logger.mock'
import {
  googleUserWithRecovery,
  sampleRecoveryEmail as sampleEmail,
  userWithRecovery
} from '../../test/password-recovery/fixtures/recover-password.fixtures'
import {
  expiryMinutes,
  forwardSystemTimeOnceBy,
  validCode,
  validRecovery
} from '../../test/password-recovery/fixtures/validate-code.fixtures'
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
    module.useLogger(new EmptyLogger())

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

  describe(`recover()`, () => {
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

    it(`should rethrow the error when it's not due to already existing recovery code.`, async () => {
      passwordRecoveryRepository.create = jest
        .fn()
        .mockRejectedValue(new Error('Any error other error.'))

      expect.assertions(2)
      try {
        await passwordRecoveryService.recover(sampleEmail)
      } catch (error) {
        expect(error).not.toBeInstanceOf(ConflictException)
        expect(error).toHaveProperty('message', `Any error other error.`)
      }
    })
  })

  describe(`validateCode()`, () => {
    it(`should return the same recovery code when the code is valid.`, async () => {
      const validatedCode = await passwordRecoveryService.validateCode(
        validCode
      )
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

    it(`should throw when the given recovery code is expired.`, async () => {
      // make the code expire
      forwardSystemTimeOnceBy(expiryMinutes())

      expect.assertions(2)
      try {
        await passwordRecoveryService.validateCode(validCode)
      } catch (error) {
        expect(error).toBeInstanceOf(UnauthorizedException)
        expect(error).toHaveProperty(
          'message',
          `The recovery code has expired.`
        )
      }
    })

    it(`should delete the given recovery code when it is expired.`, async () => {
      // need to mock the recovery here, because we need the same instance for assertion
      const recovery = validRecovery()
      passwordRecoveryRepository.findByCode = jest
        .fn()
        .mockResolvedValue(recovery)

      // make the code expire
      forwardSystemTimeOnceBy(expiryMinutes())

      expect.assertions(1)
      try {
        await passwordRecoveryService.validateCode(validCode)
      } catch (error) {
        expect(passwordRecoveryRepository.delete).toBeCalledWith(recovery)
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
