import { Module } from '@nestjs/common'
import { EmailServiceModule } from '../email-service/email-service.module'
import { EmailService } from '../email-service/email.service'
import { UsersModule } from '../users/users.module'
import { UsersRepository } from '../users/users.repository'
import { RecoveryController } from './password-recovery.controller'
import { PasswordRecoveryRepository } from './password-recovery.repository'
import { PasswordRecoveryService } from './password-recovery.service'

@Module({
  imports: [UsersModule, EmailServiceModule],
  controllers: [RecoveryController],
  providers: [
    PasswordRecoveryService,
    PasswordRecoveryRepository,
    UsersRepository,
    EmailService
  ]
})
export class PasswordRecoveryModule {}
