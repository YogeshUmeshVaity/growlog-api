import { createMock } from '@golevelup/ts-jest'
import {
  ExecutionContext,
  NotFoundException,
  SetMetadata,
  UnauthorizedException
} from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import { JwtService } from '@nestjs/jwt'
import { Test, TestingModule } from '@nestjs/testing'
import { sampleUser } from '../../test/users/fixtures/find-me.fixtures'
import { sampleToken } from '../../test/users/fixtures/sign-up.fixtures'
import { UsersService } from '../users/users.service'
import { AuthService } from './auth.service'
import {
  IS_PUBLIC_ROUTE_KEY,
  JwtAuthGuard,
  PublicRoute
} from './jwt-auth.guard'

describe('JwtAuthGuard', () => {
  let jwtAuthGuard: JwtAuthGuard
  let jwtService: JwtService
  let usersService: UsersService
  let reflector: Reflector

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JwtAuthGuard,
        jwtServiceMock(),
        authServiceMock(),
        usersServiceMock(),
        reflectorMock()
      ]
    }).compile()

    jwtAuthGuard = module.get<JwtAuthGuard>(JwtAuthGuard)
    jwtService = module.get<JwtService>(JwtService)
    reflector = module.get<Reflector>(Reflector)
    usersService = module.get<UsersService>(UsersService)
  })

  it('should be defined', () => {
    expect(jwtAuthGuard).toBeDefined()
  })

  describe(`canActivate`, () => {
    it(`should allow access when valid token.`, async () => {
      const context = createMock<ExecutionContext>()
      context.switchToHttp().getRequest.mockReturnValue({
        headers: { authorization: `bearer ${sampleToken.token}` }
      })
      const canAccess = await jwtAuthGuard.canActivate(context)
      expect(canAccess).toBeTruthy()
    })

    it(`should allow access when route has @PublicRoute decorator.`, async () => {
      const context = createMock<ExecutionContext>()
      // Make the get() return true for @PublicRoute
      jest.spyOn(reflector, 'get').mockImplementation((key: string) => {
        switch (key) {
          case IS_PUBLIC_ROUTE_KEY:
            return true
          default:
            return false
        }
      })
      const canAccess = await jwtAuthGuard.canActivate(context)
      expect(canAccess).toBeTruthy()
    })

    it(`should throw when no authorization header.`, async () => {
      const context = createMock<ExecutionContext>()
      context.switchToHttp().getRequest.mockReturnValue({
        headers: {}
      })
      expect.assertions(2)
      try {
        await jwtAuthGuard.canActivate(context)
      } catch (error) {
        expect(error).toBeInstanceOf(UnauthorizedException)
        expect(error).toHaveProperty('message', 'Token was not found.')
      }
    })

    it(`should throw when no bearer prefix in authorization header.`, async () => {
      const context = createMock<ExecutionContext>()
      context.switchToHttp().getRequest.mockReturnValue({
        headers: { authorization: sampleToken.token }
      })
      expect.assertions(2)
      try {
        await jwtAuthGuard.canActivate(context)
      } catch (error) {
        expect(error).toBeInstanceOf(UnauthorizedException)
        expect(error).toHaveProperty(
          'message',
          'Authorization type is not valid.'
        )
      }
    })

    it(`should throw when token not found.`, async () => {
      const context = createMock<ExecutionContext>()
      context.switchToHttp().getRequest.mockReturnValue({
        headers: { authorization: `bearer ` }
      })
      expect.assertions(2)
      try {
        await jwtAuthGuard.canActivate(context)
      } catch (error) {
        expect(error).toBeInstanceOf(UnauthorizedException)
        expect(error).toHaveProperty('message', 'Token was not provided.')
      }
    })

    it(`should throw when unable to decode token.`, async () => {
      const context = createMock<ExecutionContext>()
      context.switchToHttp().getRequest.mockReturnValue({
        headers: { authorization: `bearer ${sampleToken.token}` }
      })
      jest.spyOn(jwtService, 'decode').mockReturnValue(null)
      expect.assertions(2)
      try {
        await jwtAuthGuard.canActivate(context)
      } catch (error) {
        expect(error).toBeInstanceOf(UnauthorizedException)
        expect(error).toHaveProperty(
          'message',
          'Unable to decode the provided token.'
        )
      }
    })

    it(`should throw when user is not found.`, async () => {
      const context = createMock<ExecutionContext>()
      context.switchToHttp().getRequest.mockReturnValue({
        headers: { authorization: `bearer ${sampleToken.token}` }
      })
      jest.spyOn(usersService, 'findById').mockResolvedValue(null)
      expect.assertions(2)
      try {
        await jwtAuthGuard.canActivate(context)
      } catch (error) {
        expect(error).toBeInstanceOf(NotFoundException)
        expect(error).toHaveProperty('message', 'User was not found.')
      }
    })
  })

  describe(`PublicRoute`, () => {
    it(`should set the correct metadata.`, async () => {
      expect(PublicRoute()).toEqual(SetMetadata(IS_PUBLIC_ROUTE_KEY, true))
    })
  })
})

function authServiceMock() {
  return {
    provide: AuthService,
    useValue: {
      verifyTokenFor: jest.fn().mockResolvedValue({})
    }
  }
}

function jwtServiceMock() {
  return {
    provide: JwtService,
    useValue: {
      signAsync: jest.fn().mockResolvedValue(sampleToken),
      verifyAsync: jest
        .fn()
        .mockRejectedValue(new UnauthorizedException('Token is invalid.')),
      decode: jest.fn().mockReturnValue({
        userId: sampleUser().id,
        username: sampleUser().username
      })
    }
  }
}

function usersServiceMock() {
  return {
    provide: UsersService,
    useValue: {
      findById: jest.fn().mockResolvedValue(sampleUser())
    }
  }
}

function reflectorMock() {
  return {
    provide: Reflector,
    useValue: {
      get: jest.fn((key: string) => {
        switch (key) {
          case IS_PUBLIC_ROUTE_KEY:
            return false
          default:
            return false
        }
      })
    }
  }
}
