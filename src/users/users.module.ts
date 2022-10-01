import { Module } from '@nestjs/common'
import { AuthModule } from '../auth/auth.module'
import { AuthService } from '../auth/auth.service'
import { GoogleAuthService } from '../auth/google-auth.service'
import { EmailService } from './email.service'
import { PasswordRecoveryRepository } from './password-recovery.repository'
import { UsersController } from './users.controller'
import { UsersRepository } from './users.repository'
import { UsersService } from './users.service'

@Module({
  imports: [AuthModule],
  controllers: [UsersController],
  providers: [
    UsersService,
    AuthService,
    GoogleAuthService,
    EmailService,
    UsersRepository,
    PasswordRecoveryRepository
  ]
})
export class UsersModule {}
