import { Test, TestingModule } from '@nestjs/testing'
import { sampleUser } from '../../test/users/fixtures/find-me.fixtures'
import { sampleToken } from '../../test/users/fixtures/sign-up.fixtures'
import { GoogleAuthService } from './google-auth.service'
import { google } from 'googleapis'
import { BadRequestException } from '@nestjs/common'
import { configServiceMock } from '../../test/common-mocks/config-service.mock'
import { EmptyLogger } from '../../test/common-mocks/logger.mock'

jest.mock('googleapis', () => {
  const actualGoogleApis = jest.requireActual('googleapis')
  const mockGoogleApis = {
    google: {
      auth: actualGoogleApis.google.auth,
      oauth2: jest.fn().mockReturnValue({
        userinfo: {
          get: jest.fn().mockResolvedValue({
            data: {
              id: sampleUser().googleId,
              name: sampleUser().username,
              email: sampleUser().email
            }
          })
        }
      })
    }
  }
  return mockGoogleApis
})

describe('GoogleAuthService', () => {
  let googleAuthService: GoogleAuthService

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [GoogleAuthService, configServiceMock()]
    }).compile()
    // suppresses the log messages created from the code used in tests.
    module.useLogger(new EmptyLogger())

    googleAuthService = module.get<GoogleAuthService>(GoogleAuthService)
  })

  it('should be defined', () => {
    expect(googleAuthService).toBeDefined()
  })

  describe(`getUserData`, () => {
    it(`should return user data from google.`, async () => {
      const userData = await googleAuthService.getUserData(sampleToken.token)
      expect(userData.name).toEqual(sampleUser().username)
      expect(userData.id).toEqual(sampleUser().googleId)
      expect(userData.email).toEqual(sampleUser().email)
    })

    it(`should throw error when credentials are invalid.`, async () => {
      mockGoogleError()
      expect.assertions(2)
      try {
        await googleAuthService.getUserData(sampleToken.token)
      } catch (error) {
        expect(error).toBeInstanceOf(BadRequestException)
        expect(error).toHaveProperty(
          'message',
          'Invalid Google OAuth2 access token or scopes.'
        )
      }
    })
  })
})

/**
 * Mocks an error from google. We need to import 'googleapis', because we cannot call
 * jest.mock() inside the it() function. The reason is that when we import GoogleAuthService at the
 * top and call jest.mock() in inside the it(), the real googleapis are used instead of mocks. The
 * behavior is the same whether we mock using jest.mock(), jest.doMock() or jest.setMock().
 * So to solve this, we use the pattern explained here in the GitHub issue:
 * https://github.com/facebook/jest/issues/2582#issuecomment-378677440
 */
function mockGoogleError() {
  google.oauth2 = jest.fn().mockReturnValue({
    userinfo: {
      get: jest.fn().mockRejectedValue(new Error())
    }
  })
}
