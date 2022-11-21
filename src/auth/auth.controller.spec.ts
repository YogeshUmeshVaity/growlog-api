import { createMock } from '@golevelup/ts-jest'
import { Test, TestingModule } from '@nestjs/testing'
import { Request } from 'express'
import {
  sampleToken,
  userWithCorrectInfo as user
} from '../../test/auth/fixtures/sign-up.fixtures'
import { correctPasswords } from '../../test/auth/fixtures/update-password.fixtures'
import { sampleUser } from '../../test/users/fixtures/find-me.fixtures'
import { AuthService } from '../auth/auth.service'
import { AuthController } from './auth.controller'
import { JwtAuthGuard } from './jwt-auth.guard'

describe('AuthController', () => {
  let authController: AuthController
  let authService: AuthService

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: {
            signUp: jest.fn().mockResolvedValue(sampleToken),
            login: jest.fn().mockResolvedValue(sampleToken),
            loginWithGoogle: jest.fn().mockResolvedValue(sampleToken),
            logoutOtherDevices: jest.fn().mockResolvedValue(sampleToken),
            verifyTokenFor: jest.fn().mockResolvedValue({}),
            updatePassword: jest.fn()
          }
        }
      ]
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({
        canActivate: jest.fn().mockResolvedValue(true)
      })
      .compile()

    authController = module.get<AuthController>(AuthController)
    authService = module.get<AuthService>(AuthService)
  })

  it('should be defined', () => {
    expect(authController).toBeDefined()
  })

  describe(`signUp`, () => {
    it(`should return a token when correct user info is provided.`, async () => {
      const returnedToken = await authController.signUp(user)
      expect(returnedToken).toEqual(sampleToken)
      expect(authService.signUp).toBeCalledWith(user)
    })
  })

  describe(`login`, () => {
    it(`should return a token when correct credentials are provided.`, async () => {
      const returnedToken = await authController.login({
        username: user.username,
        password: user.password
      })
      expect(returnedToken).toEqual(sampleToken)
      expect(authService.login).toBeCalledWith(user.username, user.password)
    })
  })

  describe(`loginWithGoogle`, () => {
    it(`should return a token when correct google access token is provided.`, async () => {
      const request = createMock<Request>()
      request.headers = { authorization: `bearer ${sampleToken.token}` }
      const returnedToken = await authController.loginWithGoogle(request)
      expect(returnedToken).toEqual(sampleToken)
    })
  })

  describe(`logoutOtherDevices`, () => {
    it(`should invalidate the existing tokens from all devices.`, async () => {
      const user = sampleUser()
      const returnedToken = await authController.logoutOtherDevices(user)
      expect(returnedToken).toEqual(sampleToken)
      expect(authService.logoutOtherDevices).toBeCalledWith(user)
    })
  })

  describe(`updatePassword`, () => {
    it(`should update the password when valid info is provided.`, async () => {
      const user = sampleUser()
      await authController.updatePassword(user, correctPasswords)
      expect(authService.updatePassword).toBeCalledWith(user, correctPasswords)
    })
  })
})
