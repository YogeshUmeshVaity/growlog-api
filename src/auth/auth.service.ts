import {
  BadRequestException,
  Injectable,
  Logger,
  UnauthorizedException
} from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { JwtService, JwtSignOptions } from '@nestjs/jwt'
import { SignUpDto } from '../users/dtos/signup-user.dto'
import { User } from '../users/user.entity'
import { UsersRepository } from '../users/users.repository'
import { Token } from './dtos/token.dto'
import { GoogleAuthService, GoogleUser } from './google-auth.service'
import * as bcrypt from 'bcrypt'
import { UpdatePasswordDto } from '../users/dtos/update-password.dto'

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name)
  constructor(
    private readonly usersRepo: UsersRepository,
    private readonly googleAuthService: GoogleAuthService,
    private readonly configService: ConfigService,
    private readonly jwtService: JwtService
  ) {}

  async signUp(userInfo: SignUpDto) {
    const { password, confirmPassword, username, email } = userInfo
    this.throwIfPasswordsMismatch(password, confirmPassword)
    await this.throwIfUsernameExists(username)
    await this.throwIfEmailExists(email)
    const hashedPassword = await this.hash(password)
    const hashedUser = await this.createHashedUser(userInfo, hashedPassword)
    const newUser = await this.saveToDb(hashedUser)
    return await this.sendToken(newUser)
  }

  async login(username: string, password: string) {
    const user = await this.usersRepo.findByName(username)
    this.throwIfUserNotFound(user, username)
    await this.throwIfIncorrectPassword(user, password)
    return this.sendToken(user)
  }

  async updatePassword(user: User, passwordDto: UpdatePasswordDto) {
    const { newPassword, confirmPassword, currentPassword } = passwordDto
    this.throwIfSocialUser(user)
    this.throwIfPasswordsMismatch(newPassword, confirmPassword)
    await this.throwIfIncorrectPassword(user, currentPassword)
    await this.throwIfNewPasswordIsSame(user, newPassword)
    const hashedPassword = await this.hash(newPassword)
    await this.usersRepo.updatePassword(user.id, hashedPassword)
  }

  async loginWithGoogle(googleAccessToken: string) {
    const userInfo = await this.googleAuthService.getUserData(googleAccessToken)
    const existingUser = await this.usersRepo.findByGoogleId(userInfo.id)

    if (existingUser) {
      await this.updateEmailIfChanged(existingUser, userInfo)
      return await this.sendToken(existingUser)
    } else {
      const newUser = await this.createGoogleUser(userInfo)
      return await this.sendToken(newUser)
    }
  }

  async logoutOtherDevices(user: User) {
    user.invalidateAllTokens()
    await this.usersRepo.update(user)
    return await this.sendToken(user)
  }

  async sendToken(user: User): Promise<Token> {
    return await this.generateJwt(user)
  }

  private async generateJwt(user: User): Promise<Token> {
    const token = await this.jwtService.signAsync(
      this.jwtPayload(user),
      this.jwtOptions(user)
    )
    return { token }
  }

  async verifyTokenFor(user: User, token: string) {
    try {
      await this.jwtService.verifyAsync(token, this.jwtOptions(user))
    } catch {
      throw new UnauthorizedException('Token is invalid.')
    }
  }

  private jwtPayload(user: User) {
    return {
      userId: user.id,
      username: user.username
    }
  }

  private jwtOptions(user: User): JwtSignOptions {
    return {
      secret: this.jwtSecret(user),
      expiresIn: this.jwtExpiration()
    }
  }

  private jwtSecret(user: User) {
    return this.configService.get<string>('JWT_SECRET') + user.tokenInvalidator
  }

  private jwtExpiration() {
    return this.configService.get<string>('JWT_EXPIRY')
  }

  private throwIfPasswordsMismatch(password: string, confirmPassword: string) {
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

  private async hash(password: string) {
    const salt = await bcrypt.genSalt()
    return await bcrypt.hash(password, salt)
  }

  private async createHashedUser(userInfo: SignUpDto, hashedPassword: string) {
    const hashedUser: SignUpDto = {
      ...userInfo,
      password: hashedPassword
    }
    return hashedUser
  }

  private async saveToDb(userInfo: SignUpDto) {
    return await this.usersRepo.createLocalUser(userInfo)
  }

  private throwIfUserNotFound(user: User, username: string) {
    if (!user) {
      throw new UnauthorizedException(`User ${username} doesn't exist.`)
    }
  }

  private async throwIfIncorrectPassword(user: User, password: string) {
    const isMatch = await bcrypt.compare(password, user.hashedPassword)
    if (!isMatch) {
      throw new UnauthorizedException('Incorrect password.')
    }
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

  private throwIfSocialUser(user: User) {
    if (user.isSocial()) {
      throw new BadRequestException(
        'You have logged in using a third party. ' +
          +'Password can be changed from the third party website only.'
      )
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
}
