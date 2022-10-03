import { BadRequestException, UnauthorizedException } from '@nestjs/common'
import { Test, TestingModule } from '@nestjs/testing'
import { sampleUser } from '../../test/users/fixtures/find-me.fixtures'
import {
  sampleToken,
  userWithConfirmPasswordNoMatch,
  userWithCorrectInfo
} from '../../test/users/fixtures/sign-up.fixtures'
import { AuthService } from '../auth/auth.service'
import { GoogleAuthService } from '../auth/google-auth.service'
import { User } from './user.entity'
import { UsersRepository } from './users.repository'
import { UsersService } from './users.service'
import * as bcrypt from 'bcrypt'
import {
  correctPasswords,
  sameNewPassword,
  wrongConfirmPassword,
  wrongCurrentPassword
} from '../../test/users/fixtures/update-password.fixtures'
import { PasswordRecoveryRepository } from '../password-recovery/password-recovery.repository'
import { PasswordRecovery } from '../password-recovery/password-recovery.entity'
import { EmailService } from '../email-service/email.service'
import { configServiceMock } from '../../test/common-mocks/config-service.mock'

describe('UsersService', () => {
  let usersService: UsersService
  let usersRepo: UsersRepository
  let googleAuthService: GoogleAuthService

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        usersRepositoryMock(),
        authServiceMock(),
        googleAuthServiceMock(),
        passwordRecoveryRepositoryMock(),
        emailServiceMock(),
        configServiceMock()
      ]
    }).compile()

    usersService = module.get<UsersService>(UsersService)
    usersRepo = module.get<UsersRepository>(UsersRepository)
    googleAuthService = module.get<GoogleAuthService>(GoogleAuthService)
  })

  it('should be defined', () => {
    expect(usersService).toBeDefined()
  })

  describe('signUp', () => {
    it(`should return a token when correct user info provided.`, async () => {
      const returnedToken = await usersService.signUp(userWithCorrectInfo)
      expect(returnedToken).toEqual(sampleToken)
    })

    it(`should hash the password when correct user info provided.`, async () => {
      const repositorySpy = jest.spyOn(usersRepo, 'createLocalUser')
      await usersService.signUp(userWithCorrectInfo)
      // Get the argument that createLocalUser() was called with.
      const hashedPassword = repositorySpy.mock.calls[0][0].password
      const providedPassword = userWithCorrectInfo.password
      // Due to random salt, a different hash is generated every time even for the same input.
      // So, we can only check for inequality.
      expect(hashedPassword).not.toEqual(providedPassword)
    })

    it(`should throw when confirm-password doesn't match with password.`, async () => {
      expect.assertions(2)
      try {
        await usersService.signUp(userWithConfirmPasswordNoMatch)
      } catch (error) {
        expect(error).toBeInstanceOf(BadRequestException)
        expect(error).toHaveProperty('message', 'Confirm Password must match.')
      }
    })

    it(`should throw when username already exists.`, async () => {
      expect.assertions(3)
      usersRepo.findByName = jest.fn().mockResolvedValue(new User())
      try {
        await usersService.signUp(userWithCorrectInfo)
      } catch (error) {
        expect(error).toBeInstanceOf(BadRequestException)
        expect(error).toHaveProperty('message', 'Username already exists.')
        expect(usersRepo.findByName).toBeCalledWith(
          userWithCorrectInfo.username
        )
      }
    })

    it(`should throw when email already exists.`, async () => {
      expect.assertions(3)
      usersRepo.findByEmail = jest.fn().mockResolvedValue(new User())
      try {
        await usersService.signUp(userWithCorrectInfo)
      } catch (error) {
        expect(error).toBeInstanceOf(BadRequestException)
        expect(error).toHaveProperty('message', 'Email already exists.')
        expect(usersRepo.findByEmail).toBeCalledWith(userWithCorrectInfo.email)
      }
    })
  })

  describe(`login`, () => {
    it(`should return a token when correct credentials are provided.`, async () => {
      usersRepo.findByName = jest.fn().mockResolvedValue(new User())
      jest.spyOn(bcrypt, 'compare').mockImplementation(() => true)
      const returnedToken = await usersService.login(
        userWithCorrectInfo.username,
        userWithCorrectInfo.password
      )
      expect(returnedToken).toEqual(sampleToken)
    })

    it(`should throw error when user doesn't exist.`, async () => {
      expect.assertions(2)
      try {
        await usersService.login(
          userWithCorrectInfo.username,
          userWithCorrectInfo.password
        )
      } catch (error) {
        expect(error).toBeInstanceOf(UnauthorizedException)
        expect(error).toHaveProperty(
          'message',
          `User ${userWithCorrectInfo.username} doesn't exist.`
        )
      }
    })

    it(`should throw error when password doesn't match.`, async () => {
      usersRepo.findByName = jest.fn().mockResolvedValue(new User())
      jest.spyOn(bcrypt, 'compare').mockImplementation(() => false)
      expect.assertions(2)
      try {
        await usersService.login(
          userWithCorrectInfo.username,
          userWithCorrectInfo.password
        )
      } catch (error) {
        expect(error).toBeInstanceOf(UnauthorizedException)
        expect(error).toHaveProperty('message', `Incorrect password.`)
      }
    })
  })

  describe('loginWithGoogle', () => {
    it(`should login when the google user exists.`, async () => {
      const token = await usersService.loginWithGoogle('google-access-token')
      expect(token).toEqual(sampleToken)
      expect(usersRepo.createGoogleUser).not.toHaveBeenCalled() // ensure new user is not created
    })

    it(`should create user and login when the google user doesn't exist.`, async () => {
      usersRepo.findByGoogleId = jest.fn().mockResolvedValue(undefined) // user doesn't exist
      const token = await usersService.loginWithGoogle('google-access-token')
      expect(token).toEqual(sampleToken)
      expect(usersRepo.createGoogleUser).toHaveBeenCalled() // ensure new user is created
    })

    it(`should update email when the google email doesn't match.`, async () => {
      googleAuthService.getUserData = jest
        .fn()
        .mockResolvedValue({ email: 'newEmail@gmail.com' })
      jest.spyOn(usersRepo, 'findByEmail').mockResolvedValue(undefined) // email doesn't match
      await usersService.loginWithGoogle('google-access-token')
      expect(usersRepo.updateEmail).toHaveBeenCalled()
    })

    it(`should throw error when email exists while creating a new user.`, async () => {
      expect.assertions(2)
      usersRepo.findByEmail = jest.fn().mockResolvedValue(new User())
      usersRepo.findByGoogleId = jest.fn().mockResolvedValue(undefined) // triggers createNewUser()
      try {
        const token = await usersService.loginWithGoogle('google-access-token')
        console.log(token)
      } catch (error) {
        expect(error).toBeInstanceOf(BadRequestException)
        expect(error).toHaveProperty('message', 'Email already exists.')
      }
    })

    it(`should generate unique username while creating a new user.`, async () => {
      const createGoogleUserSpy = jest.spyOn(usersRepo, 'createGoogleUser')
      usersRepo.findByGoogleId = jest.fn().mockResolvedValue(undefined) // triggers createNewUser()
      // same username once. We use 'once' to prevent the recursive function from running endlessly
      // because it should not return the same value again and again.
      usersRepo.findByName = jest.fn().mockResolvedValueOnce(sampleUser()) // same username
      await usersService.loginWithGoogle('google-access-token')
      // get the second argument passed to the createGoogleUser() which is username.
      const generatedUsername = createGoogleUserSpy.mock.calls[0][1]
      expect(generatedUsername).not.toEqual(sampleUser().username)
    })
  })

  describe('findById', () => {
    it(`should return a user when correct userId provided.`, async () => {
      const returnedUser = await usersService.findById(sampleUser().id)
      expect(returnedUser.id).toEqual(sampleUser().id)
      expect(returnedUser.username).toEqual(sampleUser().username)
    })
  })

  describe(`logoutOtherDevices`, () => {
    it(`should change the tokenInvalidator of the user.`, async () => {
      const user = sampleUser()
      const previousTokenInvalidator = user.tokenInvalidator
      await usersService.logoutOtherDevices(user)
      const currentTokenInvalidator = user.tokenInvalidator
      expect(previousTokenInvalidator).not.toEqual(currentTokenInvalidator)
    })

    it(`should return a token for current device.`, async () => {
      const user = sampleUser()
      const returnedToken = await usersService.logoutOtherDevices(user)
      expect(returnedToken).toEqual(sampleToken)
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

  describe(`updatePassword`, () => {
    it(`should throw error when user is logged-in using third party.`, async () => {
      expect.assertions(2)
      const user = sampleUser()
      try {
        await usersService.updatePassword(user, correctPasswords)
      } catch (error) {
        expect(error).toBeInstanceOf(BadRequestException)
        expect(error).toHaveProperty(
          'message',
          'You have logged in using a third party. ' +
            +'Password can be changed from the third party website only.'
        )
      }
    })

    it(`should throw error when confirm-password doesn't match the new-password.`, async () => {
      expect.assertions(2)
      const user = sampleUser()
      user.googleId = undefined // mock user not to be social
      try {
        await usersService.updatePassword(user, wrongConfirmPassword)
      } catch (error) {
        expect(error).toBeInstanceOf(BadRequestException)
        expect(error).toHaveProperty('message', 'Confirm Password must match.')
      }
    })

    it(`should throw error when current-password is incorrect.`, async () => {
      expect.assertions(2)
      const user = sampleUser()
      user.googleId = undefined // mock user not to be social
      // mock currentPassword === existingPassword
      jest.spyOn(bcrypt, 'compare').mockImplementationOnce(() => false)

      try {
        await usersService.updatePassword(user, wrongCurrentPassword)
      } catch (error) {
        expect(error).toBeInstanceOf(UnauthorizedException)
        expect(error).toHaveProperty('message', 'Incorrect password.')
      }
    })

    it(`should throw error when new-password is same as existing password.`, async () => {
      expect.assertions(2)
      const user = sampleUser()
      user.googleId = undefined // mock user not to be social
      jest.spyOn(bcrypt, 'compare').mockImplementation(() => true)

      try {
        await usersService.updatePassword(user, sameNewPassword)
      } catch (error) {
        expect(error).toBeInstanceOf(BadRequestException)
        expect(error).toHaveProperty(
          'message',
          'New password and existing password cannot be the same.'
        )
      }
    })

    it(`should hash the password before updating.`, async () => {
      const user = sampleUser()
      user.googleId = undefined // mock user not to be social
      jest
        .spyOn(bcrypt, 'compare')
        .mockImplementationOnce(() => true) // currentPassword === existingPassword
        .mockImplementationOnce(() => false) // newPassword !== existingPassword

      const repositorySpy = jest.spyOn(usersRepo, 'updatePassword')
      await usersService.updatePassword(user, correctPasswords)

      // Get the argument that updatePassword() was called with.
      const hashedPassword = repositorySpy.mock.calls[0][1]
      const newPassword = correctPasswords.newPassword
      // Due to random salt, a different hash is generated every time even for the same input.
      // So, we can only check for inequality.
      expect(hashedPassword).not.toEqual(newPassword)
    })

    it(`should update the password when valid info is provided.`, async () => {
      const user = sampleUser()
      user.googleId = undefined // mock user not to be social
      jest
        .spyOn(bcrypt, 'compare')
        .mockImplementationOnce(() => true) // currentPassword === existingPassword
        .mockImplementationOnce(() => false) // newPassword !== existingPassword

      await expect(
        usersService.updatePassword(user, correctPasswords)
      ).resolves.not.toThrowError()
      expect(usersRepo.updatePassword).toBeCalled()
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

function googleAuthServiceMock() {
  return {
    provide: GoogleAuthService,
    useValue: {
      getUserData: jest.fn().mockResolvedValue({
        id: sampleUser().googleId,
        name: sampleUser().username,
        email: sampleUser().email
      })
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
