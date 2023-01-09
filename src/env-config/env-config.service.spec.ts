import { ConfigService } from '@nestjs/config'
import { Test, TestingModule } from '@nestjs/testing'
import { EnvConfigService } from './env-config.service'

describe('EnvConfigService', () => {
  let config: EnvConfigService

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [EnvConfigService, configServiceMock()]
    }).compile()

    config = module.get<EnvConfigService>(EnvConfigService)
  })

  describe('jwtSecret', () => {
    it(`should return the value of JWT_SECRET from Env.`, async () => {
      expect(config.jwtSecret).toEqual(jwtSecretMock)
    })
  })

  describe('googleAuthClientId', () => {
    it(`should return the value of GOOGLE_OAUTH_CLIENT_ID from Env.`, async () => {
      expect(config.googleAuthClientId).toEqual(googleAuthClientIdMock)
    })
  })

  describe('googleAuthClientSecret', () => {
    it(`should return the value of GOOGLE_OAUTH_CLIENT_SECRET from Env.`, async () => {
      expect(config.googleAuthClientSecret).toEqual(googleAuthClientSecretMock)
    })
  })

  describe('jwtExpiry', () => {
    it(`should return the value of JWT_EXPIRY from Env.`, async () => {
      expect(config.jwtExpiry).toEqual(jwtExpiryMock)
    })
  })

  describe('postmarkServerToken', () => {
    it(`should return the value of POSTMARK_SERVER_TOKEN from Env.`, async () => {
      expect(config.postmarkServerToken).toEqual(postmarkServerTokenMock)
    })
  })

  describe('fromEmail', () => {
    it(`should return the value of FROM_EMAIL from Env.`, async () => {
      expect(config.fromEmail).toEqual(fromEmailMock)
    })
  })

  describe('companyName', () => {
    it(`should return the value of COMPANY_NAME from Env.`, async () => {
      expect(config.companyName).toEqual(companyNameMock)
    })
  })

  describe('recoveryCodeExpiryMinutes', () => {
    it(`should return the value of RECOVERY_CODE_EXPIRY_MINUTES from Env.`, async () => {
      expect(config.recoveryCodeExpiryMinutes).toEqual(
        recoveryCodeExpiryMinutesMock
      )
    })
  })

  describe('postgresHost', () => {
    it(`should return the value of POSTGRES_HOST from Env.`, async () => {
      expect(config.postgresHost).toEqual(postgresHostMock)
    })
  })

  describe('postgresPort', () => {
    it(`should return the value of POSTGRES_PORT from Env.`, async () => {
      expect(config.postgresPort).toEqual(postgresPortMock)
    })
  })

  describe('postgresDatabaseName', () => {
    it(`should return the value of POSTGRES_DATABASE_NAME from Env.`, async () => {
      expect(config.postgresDatabaseName).toEqual(postgresDatabaseNameMock)
    })
  })

  describe('postgresUsername', () => {
    it(`should return the value of POSTGRES_USER_NAME from Env.`, async () => {
      expect(config.postgresUsername).toEqual(postgresUsernameMock)
    })
  })

  describe('postgresPassword', () => {
    it(`should return the value of POSTGRES_PASSWORD from Env.`, async () => {
      expect(config.postgresPassword).toEqual(postgresPasswordMock)
    })
  })
})

// mock values of environment variables
const googleAuthClientIdMock = 'googleAuthClientId'
const googleAuthClientSecretMock = 'googleAuthClientSecret'
const jwtSecretMock = 'jwtSecret'
const jwtExpiryMock = 'jwtExpiry'
const postmarkServerTokenMock = 'postmarkServerToken'
const fromEmailMock = 'fromEmail'
const companyNameMock = 'companyName'
const recoveryCodeExpiryMinutesMock = 60
const postgresHostMock = 'postgresHost'
const postgresPortMock = 6000
const postgresDatabaseNameMock = 'postgresDatabaseName'
const postgresUsernameMock = 'postgresUsername'
const postgresPasswordMock = 'postgresPassword'

/**
 * This is an example of how to mock the ConfigService. We can also use the real ConfigService as a
 * provider instead of this mock. The real ConfigService will use the values depending on the test
 * or development environment. See an example in password-recovery.service.spec for the real
 * ConfigService.
 */
export function configServiceMock() {
  return {
    provide: ConfigService,
    useValue: {
      get: jest.fn((key: string) => {
        switch (key) {
          case 'JWT_SECRET':
            return jwtSecretMock
          case 'JWT_EXPIRY':
            return jwtExpiryMock
          case 'COMPANY_NAME':
            return companyNameMock
          case 'FROM_EMAIL':
            return fromEmailMock
          case 'POSTMARK_SERVER_TOKEN':
            return postmarkServerTokenMock
          case 'RECOVERY_CODE_EXPIRY_MINUTES':
            return recoveryCodeExpiryMinutesMock
          case 'POSTGRES_HOST':
            return postgresHostMock
          case 'POSTGRES_PORT':
            return postgresPortMock
          case 'POSTGRES_USER_NAME':
            return postgresUsernameMock
          case 'POSTGRES_PASSWORD':
            return postgresPasswordMock
          case 'POSTGRES_DATABASE_NAME':
            return postgresDatabaseNameMock
          case 'GOOGLE_OAUTH_CLIENT_ID':
            return googleAuthClientIdMock
          case 'GOOGLE_OAUTH_CLIENT_SECRET':
            return googleAuthClientSecretMock
          default:
            return null
        }
      })
    }
  }
}
