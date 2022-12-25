import { EnvConfigService } from '../../src/env-config/env-config.service'

/**
 * This is an example of how to mock the ConfigService. We can also use the real ConfigService as a
 * provider instead of this mock. The real ConfigService will use the values depending on the test
 * or development environment. See an example in password-recovery.service.spec for the real
 * ConfigService.
 */
export function envConfigServiceMock() {
  return {
    provide: EnvConfigService,
    useValue: {
      googleAuthClientId: jest.fn().mockReturnValue({}),
      googleAuthClientSecret: jest.fn().mockReturnValue({}),
      jwtSecret: jest.fn().mockReturnValue('test_secret'),
      jwtExpiry: jest.fn().mockReturnValue('1y')
    }
  }
}
