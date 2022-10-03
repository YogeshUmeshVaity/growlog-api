import { Injectable, Logger, NotFoundException } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { EmailMessage } from '../users/dtos/email-message.dto'
import { EmailService } from '../email-service/email.service'
import { User } from '../users/user.entity'
import { UsersRepository } from '../users/users.repository'
import { PasswordRecovery } from './password-recovery.entity'
import { PasswordRecoveryRepository } from './password-recovery.repository'
import * as crypto from 'crypto'

@Injectable()
export class PasswordRecoveryService {
  private readonly logger = new Logger(PasswordRecoveryService.name)
  constructor(
    private readonly usersRepo: UsersRepository,
    private readonly passwordRecoveryRepo: PasswordRecoveryRepository,
    private readonly emailService: EmailService,
    private readonly configService: ConfigService
  ) {}

  async recover(email: string) {
    const user = await this.usersRepo.findByEmailWithRecovery(email)
    this.logger.debug('User for recovering password: ', JSON.stringify(user))
    this.throwIfNoUserByEmail(user)
    const passwordRecovery = await this.createPasswordRecovery(user)
    const recoveryMessage = this.prepareRecoveryMessage(passwordRecovery, email)
    // must set email provider settings in env variables for this to work.
    await this.emailService.sendEmail(recoveryMessage)
    return 'A password reset link has been sent to your email.'
  }

  private prepareRecoveryMessage(
    passwordRecovery: PasswordRecovery,
    toEmail: string
  ) {
    const baseUrl = this.configService.get<string>('BASE_URL')
    const companyName = this.configService.get<string>('COMPANY_NAME')
    const passwordResetLink = `${baseUrl}/recover-password/${passwordRecovery.code}`
    const fromEmail = this.configService.get<string>('FROM_EMAIL')
    const subject = `Password reset at ${companyName}`
    const body = passwordResetLink
    const emailMessage: EmailMessage = { fromEmail, toEmail, subject, body }
    return emailMessage
  }

  private async createPasswordRecovery(user: User) {
    await this.deleteExistingRecovery(user)
    return this.createNewRecovery(user)
  }

  private async deleteExistingRecovery(user: User) {
    if (user.passwordRecovery) {
      // need to set the foreign key to null otherwise we'll get the foreign key constrain error
      // so, copy the recovery to delete and set it to null
      const recoveryToDelete = user.passwordRecovery
      user.passwordRecovery = null
      await this.usersRepo.update(user)
      await this.passwordRecoveryRepo.delete(recoveryToDelete)
    }
  }

  private async createNewRecovery(user: User) {
    // could be made async
    const code = crypto.randomBytes(48).toString('base64')
    const expiration = this.prepareExpiryDate()
    return await this.passwordRecoveryRepo.create(code, user, expiration)
  }

  private prepareExpiryDate() {
    const expiryPeriod = this.configService.get<number>('RECOVERY_CODE_EXPIRY')
    return new Date(Date.now() + expiryPeriod * 1000)
  }

  private throwIfNoUserByEmail(user: User) {
    if (!user) {
      throw new NotFoundException(`There's no user by this email.`)
    }
  }
}
