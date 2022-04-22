import { ConfigService } from '@nestjs/config'
import { JwtService } from '@nestjs/jwt'
import { Test, TestingModule } from '@nestjs/testing'
import { sampleToken } from '../../test/users/fixtures/sign-up.fixtures'
import { User } from '../users/user.entity'
import { AuthService } from './auth.service'

function sampleUser() {
  const user = new User()
  user.id = '30ff0b89-7a43-4892-9ccc-86bb5f16e296'
  user.username = 'abcabc123'
  user.renewTokenInvalidator()
  return user
}

const ConfigServiceMock = {
  provide: ConfigService,
  useValue: {
    get: jest.fn((key: string) => {
      switch (key) {
        case 'JWT_SECRET':
          return 'test_secret'
        case 'JWT_EXPIRY':
          return '1y'
        default:
          return null
      }
    })
  }
}

const JwtServiceMock = {
  provide: JwtService,
  useValue: {
    signAsync: jest.fn().mockResolvedValue(sampleToken)
  }
}

describe('AuthService', () => {
  let authService: AuthService

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AuthService, ConfigServiceMock, JwtServiceMock]
    }).compile()

    authService = module.get<AuthService>(AuthService)
  })

  it('should be defined', () => {
    expect(authService).toBeDefined()
  })

  describe(`logIn`, () => {
    it(`should return a token.`, async () => {
      const { token } = await authService.logIn(sampleUser())
      expect(token).toEqual(sampleToken)
    })
  })
})
