import { Module } from '@nestjs/common'
import { EmailServiceModule } from '../email-service/email-service.module'
import { EmailService } from '../email-service/email.service'
import { EnvConfigService } from '../env-config/env-config.service'
import { UsersModule } from '../users/users.module'
import { UsersRepository } from '../users/users.repository'
import { PasswordRecoveryController } from './password-recovery.controller'
import { PasswordRecoveryRepository } from './password-recovery.repository'
import { PasswordRecoveryService } from './password-recovery.service'

@Module({
  imports: [UsersModule, EmailServiceModule],
  controllers: [PasswordRecoveryController],
  providers: [
    PasswordRecoveryService,
    PasswordRecoveryRepository,
    UsersRepository,
    EmailService,
    EnvConfigService
  ]
})
export class PasswordRecoveryModule {}
