import { UnauthorizedException } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import { Test, TestingModule } from '@nestjs/testing'
import { configServiceMock } from '../../test/common-mocks/config-service.mock'
import { sampleUser } from '../../test/users/fixtures/find-me.fixtures'
import { sampleToken } from '../../test/users/fixtures/sign-up.fixtures'
import { AuthService } from './auth.service'

describe('AuthService', () => {
  let authService: AuthService
  let jwtService: JwtService

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AuthService, configServiceMock(), jwtServiceMock()]
    }).compile()

    authService = module.get<AuthService>(AuthService)
    jwtService = module.get<JwtService>(JwtService)
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
})

function jwtServiceMock() {
  return {
    provide: JwtService,
    useValue: {
      signAsync: jest.fn().mockResolvedValue(sampleToken),
      verifyAsync: jest
        .fn()
        .mockRejectedValue(new UnauthorizedException('Token is invalid.'))
    }
  }
}
