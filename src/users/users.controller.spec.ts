import { createMock } from '@golevelup/ts-jest'
import { JwtModule } from '@nestjs/jwt'
import { Test, TestingModule } from '@nestjs/testing'
import { Request } from 'express'
import { sampleUser } from '../../test/users/fixtures/find-me.fixtures'
import {
  sampleToken,
  userWithCorrectInfo as user
} from '../../test/users/fixtures/sign-up.fixtures'
import { correctPasswords } from '../../test/users/fixtures/update-password.fixtures'
import { isGuarded } from '../../test/utils/is-guarded'
import { AuthService } from '../auth/auth.service'
import { JwtAuthGuard } from '../auth/jwt-auth.guard'
import { UsersController } from './users.controller'
import { UsersService } from './users.service'

describe('UsersController', () => {
  let usersController: UsersController
  let usersService: UsersService

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [JwtModule.register(null)],
      controllers: [UsersController],
      providers: [
        {
          provide: UsersService,
          useValue: {
            signUp: jest.fn().mockResolvedValue(sampleToken),
            login: jest.fn().mockResolvedValue(sampleToken),
            loginWithGoogle: jest.fn().mockResolvedValue(sampleToken),
            logoutOtherDevices: jest.fn().mockResolvedValue(sampleToken),
            updateUsername: jest.fn(),
            updateEmail: jest.fn(),
            updatePassword: jest.fn()
          }
        },
        {
          provide: AuthService,
          useValue: {
            verifyTokenFor: jest.fn().mockResolvedValue({})
          }
        }
      ]
    }).compile()

    usersController = module.get<UsersController>(UsersController)
    usersService = module.get<UsersService>(UsersService)
  })

  it('should be defined', () => {
    expect(usersController).toBeDefined()
  })

  describe(`signUp`, () => {
    it(`should return a token when correct user info is provided.`, async () => {
      const returnedToken = await usersController.signUp(user)
      expect(returnedToken).toEqual(sampleToken)
      expect(usersService.signUp).toBeCalledWith(user)
    })
  })

  describe(`login`, () => {
    it(`should return a token when correct credentials are provided.`, async () => {
      const returnedToken = await usersController.login({
        username: user.username,
        password: user.password
      })
      expect(returnedToken).toEqual(sampleToken)
      expect(usersService.login).toBeCalledWith(user.username, user.password)
    })
  })

  describe(`loginWithGoogle`, () => {
    it(`should return a token when correct google access token is provided.`, async () => {
      const request = createMock<Request>()
      request.headers = { authorization: `bearer ${sampleToken.token}` }
      const returnedToken = await usersController.loginWithGoogle(request)
      expect(returnedToken).toEqual(sampleToken)
    })
  })

  describe(`findMe`, () => {
    it(`should be protected with JwtAuthGuard.`, async () => {
      expect(isGuarded(UsersController.prototype.findMe, JwtAuthGuard)).toBe(
        true
      )
    })

    it(`should return a user.`, async () => {
      const returnedUser = usersController.findMe(sampleUser())
      expect(returnedUser.id).toEqual(sampleUser().id)
      expect(returnedUser.username).toEqual(sampleUser().username)
    })
  })

  describe(`logoutOtherDevices`, () => {
    it(`should invalidate the existing tokens from all devices.`, async () => {
      const user = sampleUser()
      const returnedToken = await usersController.logoutOtherDevices(user)
      expect(returnedToken).toEqual(sampleToken)
      expect(usersService.logoutOtherDevices).toBeCalledWith(user)
    })
  })

  describe(`updateUsername`, () => {
    it(`should update the username when it doesn't already exist.`, async () => {
      const user = sampleUser()
      const newUsername = 'SomeNewName'
      await usersController.updateUsername(user, newUsername)
      expect(usersService.updateUsername).toBeCalledWith(user, newUsername)
    })
  })

  describe(`updateEmail`, () => {
    it(`should update the email when it doesn't already exist.`, async () => {
      const user = sampleUser()
      const newEmail = 'newEmail@gmail.com'
      await usersController.updateEmail(user, newEmail)
      expect(usersService.updateEmail).toBeCalledWith(user, newEmail)
    })
  })

  describe(`updatePassword`, () => {
    it(`should update the password when valid info is provided.`, async () => {
      const user = sampleUser()
      await usersController.updatePassword(user, correctPasswords)
      expect(usersService.updatePassword).toBeCalledWith(user, correctPasswords)
    })
  })
})
