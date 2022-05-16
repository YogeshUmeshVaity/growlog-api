import { ConfigService } from '@nestjs/config'

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
