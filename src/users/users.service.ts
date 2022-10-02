import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
  UnauthorizedException
} from '@nestjs/common'
import * as bcrypt from 'bcrypt'
import { AuthService } from '../auth/auth.service'
import { GoogleAuthService, GoogleUser } from '../auth/google-auth.service'
import { SignUpDto } from './dtos/signup-user.dto'
import { UpdatePasswordDto } from './dtos/update-password.dto'
import { User } from './user.entity'
import { UsersRepository } from './users.repository'
import { PasswordRecovery } from './password-recovery.entity'
import { ConfigService } from '@nestjs/config'
import { EmailMessage } from './dtos/email-message.dto'
import { EmailService } from './email.service'
import { PasswordRecoveryRepository } from './password-recovery.repository'
import * as crypto from 'crypto'

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name)
  constructor(
    private readonly usersRepo: UsersRepository,
    private readonly authService: AuthService,
    private readonly googleAuthService: GoogleAuthService,
    private readonly passwordRecoveryRepo: PasswordRecoveryRepository,
    private readonly emailService: EmailService,
    private readonly configService: ConfigService
  ) {}

  async signUp(userInfo: SignUpDto) {
    const { password, confirmPassword, username, email } = userInfo
    this.throwIfPasswordsNotEqual(password, confirmPassword)
    await this.throwIfUsernameExists(username)
    await this.throwIfEmailExists(email)
    const hashedPassword = await this.hash(password)
    const hashedUser = await this.createHashedUser(userInfo, hashedPassword)
    const newUser = await this.saveToDb(hashedUser)
    return await this.authService.logIn(newUser)
  }

  async login(username: string, password: string) {
    const user = await this.usersRepo.findByName(username)
    this.throwIfUserNotFound(user, username)
    await this.throwIfPasswordNoMatch(user, password)
    return this.authService.logIn(user)
  }

  private throwIfUserNotFound(user: User, username: string) {
    if (!user) {
      throw new UnauthorizedException(`User ${username} doesn't exist.`)
    }
  }

  private async throwIfPasswordNoMatch(user: User, password: string) {
    const isMatch = await bcrypt.compare(password, user.hashedPassword)
    if (!isMatch) {
      throw new UnauthorizedException('Incorrect password.')
    }
  }

  private async throwIfNewPasswordIsSame(user: User, newPassword: string) {
    const isMatch = await bcrypt.compare(newPassword, user.hashedPassword)
    if (isMatch) {
      throw new BadRequestException(
        'New password and existing password cannot be the same.'
      )
    }
  }

  async loginWithGoogle(googleAccessToken: string) {
    const userInfo = await this.googleAuthService.getUserData(googleAccessToken)
    const existingUser = await this.usersRepo.findByGoogleId(userInfo.id)

    if (existingUser) {
      await this.updateEmailIfChanged(existingUser, userInfo)
      return await this.authService.logIn(existingUser)
    } else {
      const newUser = await this.createGoogleUser(userInfo)
      return await this.authService.logIn(newUser)
    }
  }

  async logoutOtherDevices(user: User) {
    user.invalidateAllTokens()
    await this.usersRepo.update(user)
    return await this.authService.logIn(user)
  }

  async updateUsername(user: User, username: string) {
    await this.throwIfUsernameExists(username)
    await this.usersRepo.updateUsername(user.id, username)
  }

  async updateEmail(user: User, email: string) {
    await this.throwIfEmailExists(email)
    await this.usersRepo.updateEmail(user.id, email)
  }

  async updatePassword(user: User, passwordDto: UpdatePasswordDto) {
    const { newPassword, confirmPassword, currentPassword } = passwordDto
    this.throwIfSocialUser(user)
    this.throwIfPasswordsNotEqual(newPassword, confirmPassword)
    await this.throwIfPasswordNoMatch(user, currentPassword)
    await this.throwIfNewPasswordIsSame(user, newPassword)
    const hashedPassword = await this.hash(newPassword)
    await this.usersRepo.updatePassword(user.id, hashedPassword)
  }

  async recoverPassword(email: string) {
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
      throw new NotFoundException(`There's no user by this email`)
    }
  }

  private throwIfSocialUser(user: User) {
    if (user.isSocial()) {
      throw new BadRequestException(
        'You have logged in using a third party. ' +
          +'Password can be changed from the third party website only.'
      )
    }
  }

  private async createGoogleUser(userInfo: GoogleUser) {
    await this.throwIfEmailExists(userInfo.email)
    const generatedUsername = await this.generateUniqueUsername(userInfo.name)
    return await this.usersRepo.createGoogleUser(
      userInfo.id,
      generatedUsername,
      userInfo.email
    )
  }

  /**
   * Recursive function that ensures the username in the database is unique.
   * It replaces all whitespace characters with an empty string.
   * \s matches a whitespace character. g means instances of all matches, not just the first one.
   */
  private async generateUniqueUsername(googleName: string) {
    const name = googleName.replace(/\s/g, '')
    if (!(await this.usersRepo.findByName(name))) {
      return name
    }
    this.logger.log('Google username already exists. Generating another name.')
    return this.generateUniqueUsername(name + this.randomDigits())
  }

  /** Returns a 3 digit random number string. */
  private randomDigits() {
    return Math.floor(Math.random() * (999 - 100 + 1) + 100).toString()
  }

  /**
   * If the fetched social email doesn't match with the existing email and if there is no other user
   * with the fetched email, then update the existing email to the fetched email. This takes care
   * of synchronizing the email in case the user has changed their email in their OAuth account.
   *
   * Users who have emails that end in @gmail.com, can't change it. Others can.
   */
  private async updateEmailIfChanged(
    existingUser: User,
    googleUser: GoogleUser
  ) {
    if (
      existingUser.email !== googleUser.email &&
      !(await this.usersRepo.findByEmail(googleUser.email))
    ) {
      await this.usersRepo.updateEmail(existingUser.id, googleUser.email)
    }
  }

  async findById(userId: string) {
    return await this.usersRepo.findById(userId)
  }

  private async saveToDb(userInfo: SignUpDto) {
    return await this.usersRepo.createLocalUser(userInfo)
  }

  private async createHashedUser(userInfo: SignUpDto, hashedPassword: string) {
    const hashedUser: SignUpDto = {
      ...userInfo,
      password: hashedPassword
    }
    return hashedUser
  }

  private async hash(password: string) {
    const salt = await bcrypt.genSalt()
    return await bcrypt.hash(password, salt)
  }

  private throwIfPasswordsNotEqual(password: string, confirmPassword: string) {
    if (password.trim() !== confirmPassword.trim()) {
      throw new BadRequestException('Confirm Password must match.')
    }
  }

  private async throwIfUsernameExists(username: string) {
    const existingUser = await this.usersRepo.findByName(username)
    if (existingUser) {
      throw new BadRequestException('Username already exists.')
    }
  }

  private async throwIfEmailExists(email: string) {
    const existingUser = await this.usersRepo.findByEmail(email)
    if (existingUser) {
      throw new BadRequestException('Email already exists.')
    }
  }
}
