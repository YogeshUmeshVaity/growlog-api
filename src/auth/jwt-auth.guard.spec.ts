import { createMock } from '@golevelup/ts-jest'
import { ExecutionContext, UnauthorizedException } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import { Test, TestingModule } from '@nestjs/testing'
import { sampleToken } from '../../test/users/fixtures/sign-up.fixtures'
import { User } from '../users/user.entity'
import { UsersService } from '../users/users.service'
import { AuthService } from './auth.service'
import { JwtAuthGuard } from './jwt-auth.guard'

// TODO: move it to fixtures and reuse it in auth.service.spec too
function sampleUser() {
  const user = new User()
  user.id = '30ff0b89-7a43-4892-9ccc-86bb5f16e296'
  user.username = 'abcabc123'
  user.renewTokenInvalidator()
  return user
}

const jwtServiceMock = {
  signAsync: jest.fn().mockResolvedValue(sampleToken),
  verifyAsync: jest
    .fn()
    .mockRejectedValue(new UnauthorizedException('Token is invalid.')),
  decode: jest.fn().mockReturnValue({
    userId: sampleUser().id,
    username: sampleUser().username
  })
}

const authServiceMock = {
  verifyTokenFor: jest.fn().mockResolvedValue({})
}

const usersServiceMock = {
  findById: jest.fn().mockResolvedValue(sampleUser())
}

describe('AuthService', () => {
  let jwtAuthGuard: JwtAuthGuard

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JwtAuthGuard,
        {
          provide: AuthService,
          useValue: authServiceMock
        },
        {
          provide: JwtService,
          useValue: jwtServiceMock
        },
        {
          provide: UsersService,
          useValue: usersServiceMock
        }
      ]
    }).compile()

    jwtAuthGuard = module.get<JwtAuthGuard>(JwtAuthGuard)
  })

  it('should be defined', () => {
    expect(jwtAuthGuard).toBeDefined()
  })

  describe(`canActivate`, () => {
    it(`should allow the route access when valid token.`, async () => {
      const context = createMock<ExecutionContext>()
      context.switchToHttp().getRequest.mockReturnValue({
        headers: { authorization: `bearer ${sampleToken.token}` }
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
      jwtServiceMock.decode = jest.fn().mockReturnValue(null)
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
  })
})
