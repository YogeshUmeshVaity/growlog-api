import { Test, TestingModule } from '@nestjs/testing'
import { sampleUser } from '../../test/users/fixtures/find-me.fixtures'
import { sampleToken } from '../../test/users/fixtures/sign-up.fixtures'
import { GoogleAuthService } from './google-auth.service'
import { google } from 'googleapis'
import { BadRequestException } from '@nestjs/common'
import { configServiceMock } from '../../test/common-mocks/config-service.mock'
import { EmptyLogger } from '../../test/common-mocks/logger.mock'

/**
 * The jest.mock() statement at this code level is hoisted even before the import statements.
 * If we write this inside the it(), the real googleapis will be used and not the mocks.
 * If we want to test for a different condition, for example, an error for the get function below,
 * we need to import real googleapis and mock that as shown at the end of this file.
 */
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
 * Mocks an error from google. Here, we need to test for a different condition that is for an error
 * as opposed to the normal behavior mocked in the jest.mock() above. For that, we need to import
 * from 'googleapis', because we cannot call jest.mock() inside the it() function. The reason is
 * that when we import GoogleAuthService at the top and call jest.mock() in inside the it(), the
 * real googleapis are used instead of mocks. The behavior is the same whether we mock using
 * jest.mock(), jest.doMock() or jest.setMock(). So to solve this, we use the pattern explained here
 * in the GitHub issue: https://github.com/facebook/jest/issues/2582#issuecomment-378677440
 *
 * We need to use this pattern for all other various conditions that require different value to be
 * return or different behavior than the one mocked in jest.mock().
 */
function mockGoogleError() {
  google.oauth2 = jest.fn().mockReturnValue({
    userinfo: {
      get: jest.fn().mockRejectedValue(new Error())
    }
  })
}
