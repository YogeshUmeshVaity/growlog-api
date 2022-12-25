import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
  UnauthorizedException
} from '@nestjs/common'
import * as bcrypt from 'bcrypt'
import * as crypto from 'crypto'
import { QueryFailedError } from 'typeorm'
import { EmailService } from '../email-service/email.service'
import { EnvConfigService } from '../env-config/env-config.service'
import { EmailMessage } from '../users/dtos/email-message.dto'
import { User } from '../users/user.entity'
import { UsersRepository } from '../users/users.repository'
import { ResetPasswordDto } from './dtos/reset-password.dto'
import { ValidateCodeDto } from './dtos/validate-code.dto'
import { PasswordRecovery } from './password-recovery.entity'
import { PasswordRecoveryRepository } from './password-recovery.repository'

/**
 * Handles the routes related to the AccountRecovery of the User.
 * How does it work?
 * 1. User provides an email address to recoverPassword().
 * 2. recoverPassword() creates a recovery code and sends it via email.
 * 3. User provides the recovery code to validateCode().
 * 4. The validateCode() validates the code and sends the code back along with the username.
 * 6. resetPassword() validates the code and sets the new password.
 */
@Injectable()
export class PasswordRecoveryService {
  private readonly logger = new Logger(PasswordRecoveryService.name)
  constructor(
    private readonly usersRepo: UsersRepository,
    private readonly passwordRecoveryRepo: PasswordRecoveryRepository,
    private readonly emailService: EmailService,
    private readonly config: EnvConfigService
  ) {}

  /**
   * Creates a recovery code and sends it via email.
   */
  async recoverPassword(email: string) {
    const user = await this.usersRepo.findByEmailWithRecovery(email)
    this.throwIfNoUserByEmail(user)
    this.throwIfSocialUser(user)
    const passwordRecovery = await this.createPasswordRecovery(user)
    const recoveryMessage = this.prepareEmailMessage(passwordRecovery, email)
    await this.emailService.sendEmail(recoveryMessage) // need email ENVs for this.
    return 'A password reset link has been sent to your email.'
  }

  /**
   * Validates the code and sends the code back along with the username.
   */
  async validateCode(validateCodeDto: ValidateCodeDto) {
    const { recoveryCode } = validateCodeDto
    const passwordRecovery = await this.findAndValidate(recoveryCode)
    return {
      username: passwordRecovery.user.username,
      recoveryCode: recoveryCode
    }
  }

  /**
   * Sets the new password only after validating the recovery code.
   */
  async resetPassword(passwords: ResetPasswordDto) {
    const { recoveryCode, newPassword, confirmPassword } = passwords
    const passwordRecovery = await this.findAndValidate(recoveryCode)
    const user = passwordRecovery.user
    this.throwIfPasswordsMismatch(newPassword, confirmPassword)
    await this.throwIfNewPasswordIsCurrentPassword(newPassword, user)
    const hashedPassword = await this.hash(newPassword)
    await this.usersRepo.updatePassword(user.id, hashedPassword)
    await this.passwordRecoveryRepo.delete(passwordRecovery)
  }

  private throwIfPasswordsMismatch(password: string, confirmPassword: string) {
    if (password.trim() !== confirmPassword.trim()) {
      throw new BadRequestException('Confirm Password must match.')
    }
  }

  private async throwIfNewPasswordIsCurrentPassword(
    newPassword: string,
    user: User
  ) {
    const isMatch = await bcrypt.compare(newPassword, user.hashedPassword)
    if (isMatch) {
      throw new BadRequestException(
        'Do not use your old password as the new password.'
      )
    }
  }

  private async hash(password: string) {
    const salt = await bcrypt.genSalt()
    return await bcrypt.hash(password, salt)
  }

  private async findAndValidate(recoveryCode: string) {
    const passwordRecovery = await this.passwordRecoveryRepo.findByCode(
      recoveryCode
    )
    this.throwIfCodeNotFound(passwordRecovery)
    await this.throwAndDeleteIfCodeExpired(passwordRecovery)
    return passwordRecovery
  }

  private async throwAndDeleteIfCodeExpired(
    passwordRecovery: PasswordRecovery
  ) {
    const expiryTime = passwordRecovery.expiration.getTime()
    const currentTime = Date.now()
    if (expiryTime < currentTime) {
      await this.passwordRecoveryRepo.delete(passwordRecovery)
      throw new UnauthorizedException(`The recovery code has expired.`)
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
    passwordRecovery: PasswordRecovery,
    toEmail: string
  ) {
    const emailMessage: EmailMessage = {
      fromEmail: this.config.fromEmail,
      toEmail: toEmail,
      subject: this.prepareRecoveryEmailSubject(),
      body: this.prepareRecoveryEmailBody(passwordRecovery)
    }
    return emailMessage
  }

  private prepareRecoveryEmailBody(passwordRecovery: PasswordRecovery) {
    return `
    Recovery code: ${passwordRecovery.code}
    The recovery code expires in ${this.config.recoveryCodeExpiryMinutes} minutes.
    If it wasn't you who requested this password recovery, worry not, no changes will be made to your account.
    `
  }

  private prepareRecoveryEmailSubject() {
    return `Password reset at ${this.config.companyName}`
  }

  private async createPasswordRecovery(user: User) {
    await this.deleteExistingRecoveryIfAny(user)
    return this.createNewRecovery(user)
  }

  private async deleteExistingRecoveryIfAny(user: User) {
    if (user.passwordRecovery) {
      await this.passwordRecoveryRepo.delete(user.passwordRecovery)
    }
  }

  /**
   * We include this in try..catch in case the generated recovery code already exists and the
   * unique constraints error kicks in. We don't want to check the database if someone else already
   * has the same recovery code, because this is very rare. So we simply tell the user to try
   * again, if such rare situation arises.
   *
   * This design enables us to allow the user to recover the account even when they forgot
   * or don't have their username.
   */
  private async createNewRecovery(user: User) {
    const code = crypto.randomBytes(48).toString('base64url') // this could be made async
    const expiryDate = this.getExpiryTime()
    try {
      return await this.passwordRecoveryRepo.create(code, user, expiryDate)
    } catch (error) {
      if (error instanceof QueryFailedError) {
        this.logger.error(
          `Maybe two users had the same password recovery code.`
        )
        this.logger.error(error)
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
    const expiryMinutes = this.config.recoveryCodeExpiryMinutes
    return new Date(Date.now() + expiryMinutes * 60000)
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
