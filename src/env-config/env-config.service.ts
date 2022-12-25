import { Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'

@Injectable()
export class EnvConfigService {
  constructor(private configService: ConfigService) {}

  get googleAuthClientId(): string {
    return this.configService.get<string>('GOOGLE_OAUTH_CLIENT_ID')
  }

  get googleAuthClientSecret(): string {
    return this.configService.get<string>('GOOGLE_OAUTH_CLIENT_SECRET')
  }

  get jwtSecret(): string {
    return this.configService.get<string>('JWT_SECRET')
  }

  get jwtExpiry(): string {
    return this.configService.get<string>('JWT_EXPIRY')
  }

  get postmarkServerToken(): string {
    return this.configService.get<string>('POSTMARK_SERVER_TOKEN')
  }

  get fromEmail(): string {
    return this.configService.get<string>('FROM_EMAIL')
  }

  get companyName(): string {
    return this.configService.get<string>('COMPANY_NAME')
  }

  get recoveryCodeExpiryMinutes(): number {
    return this.configService.get<number>('RECOVERY_CODE_EXPIRY_MINUTES')
  }
}
