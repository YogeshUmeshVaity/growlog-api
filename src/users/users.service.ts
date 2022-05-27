import {
  BadRequestException,
  Injectable,
  Logger,
  UnauthorizedException
} from '@nestjs/common'
import * as bcrypt from 'bcrypt'
import { AuthService } from '../auth/auth.service'
import { GoogleAuthService, GoogleUser } from '../auth/google-auth.service'
import { SignUpDto } from './dtos/signup-user.dto'
import { User } from './user.entity'
import { UsersRepository } from './users.repository'

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name)
  constructor(
    private readonly usersRepo: UsersRepository,
    private readonly authService: AuthService,
    private readonly googleAuthService: GoogleAuthService
  ) {}

  async signUp(userInfo: SignUpDto) {
    this.throwIfConfirmPasswordNotEqual(userInfo)
    await this.throwIfUsernameExists(userInfo.username)
    await this.throwIfEmailExists(userInfo.email)
    const hashedUser = await this.hashThePassword(userInfo)
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
   * It replace all whitespace characters with empty string.
   * \s matches whitespace character. g means instances of all matches, not just the first one.
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

  private async hashThePassword(userInfo: SignUpDto) {
    const salt = await bcrypt.genSalt()
    const hashedPassword = await bcrypt.hash(userInfo.password, salt)
    const hashedUser: SignUpDto = {
      ...userInfo,
      password: hashedPassword
    }
    return hashedUser
  }

  private throwIfConfirmPasswordNotEqual(body: SignUpDto) {
    if (body.password.trim() !== body.confirmPassword.trim()) {
      throw new BadRequestException(
        'Confirm Password must match with Password.'
      )
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
