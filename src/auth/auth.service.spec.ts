import { BadRequestException, UnauthorizedException } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import { Test, TestingModule } from '@nestjs/testing'
import * as bcrypt from 'bcrypt'
import { envConfigServiceMock } from '../../test/common-mocks/config-service.mock'
import { sampleUser } from '../../test/users/fixtures/find-me.fixtures'
import {
  sampleToken,
  userWithConfirmPasswordNoMatch,
  userWithCorrectInfo
} from '../../test/auth/fixtures/sign-up.fixtures'
import {
  correctPasswords,
  sameNewPassword,
  wrongConfirmPassword,
  wrongCurrentPassword
} from '../../test/auth/fixtures/update-password.fixtures'
import { User } from '../users/user.entity'
import { UsersRepository } from '../users/users.repository'
import { AuthService } from './auth.service'
import { GoogleAuthService } from './google-auth.service'

describe('AuthService', () => {
  let authService: AuthService
  let jwtService: JwtService
  let usersRepo: UsersRepository
  let googleAuthService: GoogleAuthService

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        envConfigServiceMock(),
        jwtServiceMock(),
        usersRepositoryMock(),
        googleAuthServiceMock()
      ]
    }).compile()

    authService = module.get<AuthService>(AuthService)
    jwtService = module.get<JwtService>(JwtService)
    usersRepo = module.get<UsersRepository>(UsersRepository)
    googleAuthService = module.get<GoogleAuthService>(GoogleAuthService)
  })

  it('should be defined', () => {
    expect(authService).toBeDefined()
  })

  describe('signUp', () => {
    it(`should return a token when correct user info provided.`, async () => {
      const returnedToken = await authService.signUp(userWithCorrectInfo)
      expect(returnedToken).toEqual(sampleToken)
    })

    it(`should hash the password when correct user info provided.`, async () => {
      const repositorySpy = jest.spyOn(usersRepo, 'createLocalUser')
      await authService.signUp(userWithCorrectInfo)
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
        await authService.signUp(userWithConfirmPasswordNoMatch)
      } catch (error) {
        expect(error).toBeInstanceOf(BadRequestException)
        expect(error).toHaveProperty('message', 'Confirm Password must match.')
      }
    })

    it(`should throw when username already exists.`, async () => {
      expect.assertions(3)
      usersRepo.findByName = jest.fn().mockResolvedValue(new User())
      try {
        await authService.signUp(userWithCorrectInfo)
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
        await authService.signUp(userWithCorrectInfo)
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
      const returnedToken = await authService.login(
        userWithCorrectInfo.username,
        userWithCorrectInfo.password
      )
      expect(returnedToken).toEqual(sampleToken)
    })

    it(`should throw error when user doesn't exist.`, async () => {
      expect.assertions(2)
      try {
        await authService.login(
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
        await authService.login(
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
      const token = await authService.loginWithGoogle('google-access-token')
      expect(token).toEqual(sampleToken)
      expect(usersRepo.createGoogleUser).not.toHaveBeenCalled() // ensure new user is not created
    })

    it(`should create user and login when the google user doesn't exist.`, async () => {
      usersRepo.findByGoogleId = jest.fn().mockResolvedValue(undefined) // user doesn't exist
      const token = await authService.loginWithGoogle('google-access-token')
      expect(token).toEqual(sampleToken)
      expect(usersRepo.createGoogleUser).toHaveBeenCalled() // ensure new user is created
    })

    it(`should update email when the google email doesn't match.`, async () => {
      googleAuthService.getUserData = jest
        .fn()
        .mockResolvedValue({ email: 'newEmail@gmail.com' })
      jest.spyOn(usersRepo, 'findByEmail').mockResolvedValue(undefined) // email doesn't match
      await authService.loginWithGoogle('google-access-token')
      expect(usersRepo.updateEmail).toHaveBeenCalled()
    })

    it(`should throw error when email exists while creating a new user.`, async () => {
      expect.assertions(2)
      usersRepo.findByEmail = jest.fn().mockResolvedValue(new User())
      usersRepo.findByGoogleId = jest.fn().mockResolvedValue(undefined) // triggers createNewUser()
      try {
        const token = await authService.loginWithGoogle('google-access-token')
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
      await authService.loginWithGoogle('google-access-token')
      // get the second argument passed to the createGoogleUser() which is username.
      const generatedUsername = createGoogleUserSpy.mock.calls[0][1]
      expect(generatedUsername).not.toEqual(sampleUser().username)
    })
  })

  describe(`logoutOtherDevices`, () => {
    it(`should change the tokenInvalidator of the user.`, async () => {
      const user = sampleUser()
      const previousTokenInvalidator = user.tokenInvalidator
      await authService.logoutOtherDevices(user)
      const currentTokenInvalidator = user.tokenInvalidator
      expect(previousTokenInvalidator).not.toEqual(currentTokenInvalidator)
    })

    it(`should return a token for current device.`, async () => {
      const user = sampleUser()
      const returnedToken = await authService.logoutOtherDevices(user)
      expect(returnedToken).toEqual(sampleToken)
    })
  })

  describe(`sendToken`, () => {
    it(`should return a token.`, async () => {
      const token = await authService.sendToken(sampleUser())
      expect(token).toEqual(sampleToken)
    })
  })

  describe(`verifyTokenFor`, () => {
    it(`should throw exception when invalid token.`, async () => {
      expect.assertions(2)
      try {
        await authService.verifyTokenFor(sampleUser(), sampleToken.token)
      } catch (error) {
        expect(error).toBeInstanceOf(UnauthorizedException)
        expect(error).toHaveProperty('message', 'Token is invalid.')
      }
    })

    it(`should not throw exception when valid token.`, async () => {
      jest.spyOn(jwtService, 'verifyAsync').mockResolvedValue({})
      //jwtServiceMock.verifyAsync = jest.fn().mockResolvedValue({})
      await expect(
        authService.verifyTokenFor(sampleUser(), sampleToken.token)
      ).resolves.not.toThrow(UnauthorizedException)
    })
  })

  describe(`updatePassword`, () => {
    it(`should throw error when user is logged-in using third party.`, async () => {
      expect.assertions(2)
      const user = sampleUser()
      try {
        await authService.updatePassword(user, correctPasswords)
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
        await authService.updatePassword(user, wrongConfirmPassword)
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
        await authService.updatePassword(user, wrongCurrentPassword)
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
        await authService.updatePassword(user, sameNewPassword)
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
      await authService.updatePassword(user, correctPasswords)

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
        authService.updatePassword(user, correctPasswords)
      ).resolves.not.toThrowError()
      expect(usersRepo.updatePassword).toBeCalled()
    })
  })
})

function jwtServiceMock() {
  return {
    provide: JwtService,
    useValue: {
      signAsync: jest.fn().mockResolvedValue(sampleToken.token),
      verifyAsync: jest
        .fn()
        .mockRejectedValue(new UnauthorizedException('Token is invalid.'))
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
