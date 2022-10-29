import { ConfigService } from '@nestjs/config'

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
            return 'test_secret'
          case 'JWT_EXPIRY':
            return '1y'
          default:
            return null
        }
      })
    }
  }
}
