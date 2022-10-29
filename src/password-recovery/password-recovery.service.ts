import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException
} from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import * as crypto from 'crypto'
import { QueryFailedError } from 'typeorm'
import { EmailService } from '../email-service/email.service'
import { EmailMessage } from '../users/dtos/email-message.dto'
import { User } from '../users/user.entity'
import { UsersRepository } from '../users/users.repository'
import { ValidateCodeDto } from './dtos/validate-recovery-code.dto'
import { PasswordRecovery } from './password-recovery.entity'
import { PasswordRecoveryRepository } from './password-recovery.repository'

@Injectable()
export class PasswordRecoveryService {
  constructor(
    private readonly usersRepo: UsersRepository,
    private readonly passwordRecoveryRepo: PasswordRecoveryRepository,
    private readonly emailService: EmailService,
    private readonly configService: ConfigService
  ) {}

  async recover(email: string) {
    const user = await this.usersRepo.findByEmailWithRecovery(email)
    this.throwIfNoUserByEmail(user)
    this.throwIfSocialUser(user)
    const passwordRecovery = await this.createPasswordRecovery(user)
    const recoveryMessage = this.prepareEmailMessage(
      user.username,
      passwordRecovery,
      email
    )
    await this.emailService.sendEmail(recoveryMessage) // need email ENVs for this.
    return 'A password reset link has been sent to your email.'
  }

  async validateCode(validateCodeDto: ValidateCodeDto) {
    const { username, recoveryCode } = validateCodeDto
    const passwordRecovery = await this.passwordRecoveryRepo.findByCode(
      recoveryCode
    )
    this.throwIfCodeNotFound(passwordRecovery)
    this.throwIfUsernameMismatch(passwordRecovery, username)
    await this.throwAndDeleteIfCodeExpired(passwordRecovery)
    return validateCodeDto
  }

  private throwIfUsernameMismatch(
    passwordRecovery: PasswordRecovery,
    username: string
  ) {
    if (passwordRecovery.user.username != username) {
      throw new NotFoundException(`Code not found.`)
    }
  }

  private async throwAndDeleteIfCodeExpired(
    passwordRecovery: PasswordRecovery
  ) {
    const expiryTime = passwordRecovery.expiration.getTime()
    const currentTime = Date.now()
    if (expiryTime < currentTime) {
      await this.deleteExistingRecovery(passwordRecovery.user)
      throw new NotFoundException(`The recovery code has expired.`)
    }
  }

  private throwIfCodeNotFound(passwordRecovery: PasswordRecovery) {
    if (!passwordRecovery) {
      throw new NotFoundException(`Code not found.`)
    }
  }

  /**
   * For creating the recovery link instead of recovery code, use something like following:
   * const baseUrl = this.configService.get<string>('BASE_URL')
   * const passwordResetLink = `${baseUrl}/${username}/recover-password/${passwordRecovery.code}`
   */
  private prepareEmailMessage(
    username: string,
    passwordRecovery: PasswordRecovery,
    toEmail: string
  ) {
    const emailMessage: EmailMessage = {
      fromEmail: this.prepareFromEmail(),
      toEmail: toEmail,
      subject: this.prepareRecoveryEmailSubject(),
      body: this.prepareRecoveryEmailBody(username, passwordRecovery)
    }
    return emailMessage
  }

  private prepareFromEmail() {
    return this.configService.get<string>('FROM_EMAIL')
  }

  private prepareRecoveryEmailBody(
    username: string,
    passwordRecovery: PasswordRecovery
  ) {
    return `
    Username: ${username}
    Recovery code: ${passwordRecovery.code}
    The recovery code expires in ${this.getExpiryMinutes()} minutes.
    If it wasn't you who requested this password recovery, worry not, no changes will be made to your account.
    `
  }

  private prepareRecoveryEmailSubject() {
    return `Password reset at ${this.companyName()}`
  }

  private companyName() {
    this.configService.get<string>('COMPANY_NAME')
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

  /**
   * We include this in try..catch in case the generated recovery code already exists and the
   * unique constraints error kicks in. We don't want to check the database if someone else already
   * has the same recovery code, because this is very rare. So we simply tell the user to try
   * again, if such rare situation arises.
   */
  private async createNewRecovery(user: User) {
    const code = crypto.randomBytes(48).toString('base64url') // this could be made async
    const expiryDate = this.getExpiryTime()
    try {
      return await this.passwordRecoveryRepo.create(code, user, expiryDate)
    } catch (error) {
      if (error instanceof QueryFailedError) {
        throw new ConflictException('Something went wrong. Please try again.')
      } else {
        throw error
      }
    }
  }

  /**
   * 60000 milliseconds = 1 minute. So, we multiply the given minutes by 60000.
   */
  private getExpiryTime() {
    const expiryMinutes = this.getExpiryMinutes()
    return new Date(Date.now() + expiryMinutes * 60000)
  }

  private getExpiryMinutes() {
    return this.configService.get<number>('RECOVERY_CODE_EXPIRY_MINUTES')
  }

  private throwIfNoUserByEmail(user: User) {
    if (!user) {
      throw new NotFoundException(`There's no user by this email.`)
    }
  }

  private throwIfSocialUser(user: User) {
    if (user.googleId) {
      throw new BadRequestException(
        `You had previously logged in using Google. Please login using Google.`
      )
    } // else if { } here, if you add support for more third party logins.
  }
}
