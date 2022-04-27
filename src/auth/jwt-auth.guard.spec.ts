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

const JwtServiceMock = {
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

const AuthServiceMock = {
  provide: AuthService,
  useValue: {
    verifyTokenFor: jest.fn().mockResolvedValue({})
  }
}

const UsersServiceMock = {
  provide: UsersService,
  useValue: {
    findById: jest.fn().mockResolvedValue(sampleUser())
  }
}

describe('AuthService', () => {
  let jwtAuthGuard: JwtAuthGuard

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JwtAuthGuard,
        AuthServiceMock,
        JwtServiceMock,
        UsersServiceMock
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
  })
})
