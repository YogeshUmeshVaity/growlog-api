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
  mismatchedPasswords,
  validPasswords
} from '../../test/password-recovery/fixtures/reset-password.fixtures'
import {
  expiredRecovery,
  validCode,
  validRecovery
} from '../../test/password-recovery/fixtures/validate-code.fixtures'
import { userWithCorrectInfo } from '../../test/auth/fixtures/sign-up.fixtures'
import { EmailService } from '../email-service/email.service'
import { PasswordRecoveryRepository } from '../password-recovery/password-recovery.repository'
import { UsersRepository } from '../users/users.repository'
import { PasswordRecoveryService } from './password-recovery.service'
import * as bcrypt from 'bcrypt'
import { envConfigServiceMock } from '../../test/common-mocks/config-service.mock'

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
        envConfigServiceMock()
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

  describe(`recoverPassword`, () => {
    it(`should send a recovery email.`, async () => {
      await passwordRecoveryService.recoverPassword(sampleEmail)
      expect(emailService.sendEmail).toBeCalled()
    })

    it(`should notify the user that an email has been sent.`, async () => {
      const response = await passwordRecoveryService.recoverPassword(
        sampleEmail
      )
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
        await passwordRecoveryService.recoverPassword(sampleEmail)
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
        await passwordRecoveryService.recoverPassword(sampleEmail)
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
      await passwordRecoveryService.recoverPassword(sampleEmail)
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
        await passwordRecoveryService.recoverPassword(sampleEmail)
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
        await passwordRecoveryService.recoverPassword(sampleEmail)
      } catch (error) {
        expect(error).not.toBeInstanceOf(ConflictException)
        expect(error).toHaveProperty('message', `Any error other error.`)
      }
    })
  })

  describe(`validateCode`, () => {
    it(`should return the same recovery code and username when the code is valid.`, async () => {
      const validatedCode = await passwordRecoveryService.validateCode(
        validCode
      )
      expect(validatedCode.recoveryCode).toEqual(validCode.recoveryCode)
      expect(validatedCode).toHaveProperty('username')
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
      passwordRecoveryRepository.findByCode = jest
        .fn()
        .mockResolvedValue(expiredRecovery())

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
      const expiredPasswordRecovery = expiredRecovery()
      passwordRecoveryRepository.findByCode = jest
        .fn()
        .mockResolvedValue(expiredPasswordRecovery)
      expect.assertions(1)
      try {
        await passwordRecoveryService.validateCode(validCode)
      } catch (error) {
        expect(passwordRecoveryRepository.delete).toBeCalledWith(
          expiredPasswordRecovery
        )
      }
    })
  })
  describe(`resetPassword`, () => {
    it(`should set the new password when the recovery code is valid.`, async () => {
      jest.spyOn(bcrypt, 'compare').mockImplementationOnce(() => false)
      await passwordRecoveryService.resetPassword(validPasswords)
      expect(usersRepository.updatePassword).toBeCalled()
    })

    it(`should throw when the given recovery code is not found in database.`, async () => {
      passwordRecoveryRepository.findByCode = jest.fn().mockResolvedValue(null) // code not found
      expect.assertions(2)
      try {
        await passwordRecoveryService.resetPassword(validPasswords)
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
        await passwordRecoveryService.resetPassword(validPasswords)
      } catch (error) {
        expect(error).toBeInstanceOf(UnauthorizedException)
        expect(error).toHaveProperty(
          'message',
          `The recovery code has expired.`
        )
      }
    })

    it(`should delete the given recovery code when it is expired.`, async () => {
      const expiredPasswordRecovery = expiredRecovery()
      passwordRecoveryRepository.findByCode = jest
        .fn()
        .mockResolvedValue(expiredPasswordRecovery)
      expect.assertions(1)
      try {
        await passwordRecoveryService.resetPassword(validPasswords)
      } catch (error) {
        expect(passwordRecoveryRepository.delete).toBeCalledWith(
          expiredPasswordRecovery
        )
      }
    })

    it(`should throw when the new password and confirm-password do not match.`, async () => {
      expect.assertions(2)
      try {
        await passwordRecoveryService.resetPassword(mismatchedPasswords)
      } catch (error) {
        expect(error).toBeInstanceOf(BadRequestException)
        expect(error).toHaveProperty('message', `Confirm Password must match.`)
      }
    })

    it(`should throw when the new password is same as the current password.`, async () => {
      jest.spyOn(bcrypt, 'compare').mockImplementationOnce(() => true)
      expect.assertions(2)
      try {
        await passwordRecoveryService.resetPassword(validPasswords)
      } catch (error) {
        expect(error).toBeInstanceOf(BadRequestException)
        expect(error).toHaveProperty(
          'message',
          `Do not use your old password as the new password.`
        )
      }
    })

    it(`should hash the new password when the recovery code is valid.`, async () => {
      jest.spyOn(bcrypt, 'compare').mockImplementationOnce(() => false)
      jest.spyOn(bcrypt, 'hash')
      await passwordRecoveryService.resetPassword(validPasswords)
      expect(bcrypt.hash).toBeCalledWith(
        validPasswords.newPassword,
        expect.anything()
      )
    })

    it(`should delete the recovery code when the password reset is successful.`, async () => {
      jest.spyOn(bcrypt, 'compare').mockImplementationOnce(() => false)
      const recoveryToDelete = validRecovery()
      passwordRecoveryRepository.findByCode = jest
        .fn()
        .mockResolvedValue(recoveryToDelete)

      await passwordRecoveryService.resetPassword(validPasswords)
      expect(passwordRecoveryRepository.delete).toBeCalledWith(recoveryToDelete)
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
