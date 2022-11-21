import { BadRequestException, UnauthorizedException } from '@nestjs/common'
import { Test, TestingModule } from '@nestjs/testing'
import * as bcrypt from 'bcrypt'
import { configServiceMock } from '../../test/common-mocks/config-service.mock'
import { sampleUser } from '../../test/users/fixtures/find-me.fixtures'
import {
  sampleToken,
  userWithCorrectInfo
} from '../../test/auth/fixtures/sign-up.fixtures'
import {
  correctPasswords,
  sameNewPassword,
  wrongConfirmPassword,
  wrongCurrentPassword
} from '../../test/auth/fixtures/update-password.fixtures'
import { AuthService } from '../auth/auth.service'
import { EmailService } from '../email-service/email.service'
import { PasswordRecovery } from '../password-recovery/password-recovery.entity'
import { PasswordRecoveryRepository } from '../password-recovery/password-recovery.repository'
import { UsersRepository } from './users.repository'
import { UsersService } from './users.service'

describe('UsersService', () => {
  let usersService: UsersService
  let usersRepo: UsersRepository

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        usersRepositoryMock(),
        authServiceMock(),
        passwordRecoveryRepositoryMock(),
        emailServiceMock(),
        configServiceMock()
      ]
    }).compile()

    usersService = module.get<UsersService>(UsersService)
    usersRepo = module.get<UsersRepository>(UsersRepository)
  })

  it('should be defined', () => {
    expect(usersService).toBeDefined()
  })

  describe('findById', () => {
    it(`should return a user when correct userId provided.`, async () => {
      const returnedUser = await usersService.findById(sampleUser().id)
      expect(returnedUser.id).toEqual(sampleUser().id)
      expect(returnedUser.username).toEqual(sampleUser().username)
    })
  })

  describe(`updateUsername`, () => {
    it(`should update the username when it doesn't already exist.`, async () => {
      const user = sampleUser()
      const newUsername = 'SomeNewName'
      await expect(
        usersService.updateUsername(user, newUsername)
      ).resolves.not.toThrowError()
      expect(usersRepo.updateUsername).toBeCalled()
    })

    it(`should throw error when username already exist.`, async () => {
      expect.assertions(2)
      usersRepo.findByName = jest.fn().mockResolvedValue(sampleUser())
      const user = sampleUser()
      const newUsername = 'SomeNewName'
      try {
        await usersService.updateUsername(user, newUsername)
      } catch (error) {
        expect(error).toBeInstanceOf(BadRequestException)
        expect(error).toHaveProperty('message', 'Username already exists.')
      }
    })
  })

  describe(`updateEmail`, () => {
    it(`should update the email when it doesn't already exist.`, async () => {
      const user = sampleUser()
      const newEmail = 'newEmail@gmail.com'
      await expect(
        usersService.updateEmail(user, newEmail)
      ).resolves.not.toThrowError()
      expect(usersRepo.updateEmail).toBeCalled()
    })

    it(`should throw error when email already exists.`, async () => {
      expect.assertions(2)
      usersRepo.findByEmail = jest.fn().mockResolvedValue(sampleUser())
      const user = sampleUser()
      const newEmail = 'newEmail@gmail.com'
      try {
        await usersService.updateEmail(user, newEmail)
      } catch (error) {
        expect(error).toBeInstanceOf(BadRequestException)
        expect(error).toHaveProperty('message', 'Email already exists.')
      }
    })
  })
})

/**
 * We use functions for representing mocks to avoid singleton const variables. Functions are called
 * every time in the beforeEach() whereas the const variables are singletons and are reused.
 * We want the mocks to be recreated instead of reusing the same instance, before each test.
 *
 * Another reason for using functions is that we can keep all the mock objects at the bottom of the
 * file here because they are less important than the actual test code.
 */
function authServiceMock() {
  return {
    provide: AuthService,
    useValue: {
      logIn: jest.fn().mockResolvedValue(sampleToken)
    }
  }
}

function usersRepositoryMock() {
  return {
    provide: UsersRepository,
    useValue: {
      findByEmail: jest.fn().mockResolvedValue(undefined),
      findByName: jest.fn().mockResolvedValue(undefined),
      findById: jest.fn().mockResolvedValue(sampleUser()),
      findByGoogleId: jest.fn().mockResolvedValue(sampleUser()),
      createLocalUser: jest.fn().mockResolvedValue(userWithCorrectInfo),
      createGoogleUser: jest.fn().mockResolvedValue(sampleUser()),
      updateEmail: jest.fn(),
      updateUsername: jest.fn().mockResolvedValue({}),
      updatePassword: jest.fn().mockResolvedValue({}),
      update: jest.fn()
    }
  }
}

function passwordRecoveryRepositoryMock() {
  return {
    provide: PasswordRecoveryRepository,
    useValue: {
      delete: jest.fn().mockResolvedValue({}),
      create: jest.fn().mockResolvedValue(new PasswordRecovery())
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
