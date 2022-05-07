import { BadRequestException, Injectable, Logger } from '@nestjs/common'
import { SignUpDto } from './dtos/signup-user.dto'
import { UsersRepository } from './users.repository'
import * as bcrypt from 'bcrypt'
import { AuthService } from '../auth/auth.service'
import { GoogleAuthService, GoogleUser } from '../auth/google-auth.service'
import { User } from './user.entity'

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name)
  constructor(
    private readonly usersRepo: UsersRepository,
    private readonly authService: AuthService,
    private readonly googleService: GoogleAuthService
  ) {}

  async signUp(userInfo: SignUpDto) {
    this.throwIfConfirmPasswordNotEqual(userInfo)
    await this.throwIfUsernameExists(userInfo)
    await this.throwIfEmailExists(userInfo)
    const hashedUser = await this.hashThePassword(userInfo)
    const newUser = await this.saveToDb(hashedUser)
    return await this.authService.logIn(newUser)
  }

  async loginWithGoogle(googleAccessToken: string) {
    const userData = await this.googleService.getUserData(googleAccessToken)
    const existingUser = await this.usersRepo.findByGoogleId(userData.id)

    if (existingUser) {
      this.updateEmailIfChanged(existingUser, userData)
      return await this.authService.logIn(existingUser)
    } else {
      const newUser = await this.createGoogleUser(userData)
      return await this.authService.logIn(newUser)
    }
  }

  private async createGoogleUser(googleUser: GoogleUser) {
    await this.throwIfEmailAlreadyExists(googleUser)
    const username = await this.generateUniqueUsername(googleUser.name)
    return await this.usersRepo.createGoogleUser(
      googleUser.id,
      username,
      googleUser.email
    )
  }

  /** Recursive function that ensures the username in the database is unique.  */
  private async generateUniqueUsername(googleName: string) {
    // Replace all whitespace characters with empty string.
    // \s matches whitespace character. g means instances of all matches, not just the first one.
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

  private async throwIfEmailAlreadyExists(googleUser) {
    if (await this.usersRepo.findByEmail(googleUser.email)) {
      throw new BadRequestException('Email already exists.')
    }
  }

  // If the fetched social email doesn't match with the existing email and
  // if there is no other user with the fetched email, then update the existing email to the
  // fetched email. This takes care of synchronizing the email in case the user has changed
  // their email in their OAuth account.
  private async updateEmailIfChanged(
    existingUser: User,
    googleUser: GoogleUser
  ) {
    if (
      existingUser.email !== googleUser.email &&
      !(await this.usersRepo.findByEmail(googleUser.email))
    ) {
      this.usersRepo.updateEmail(existingUser.id, googleUser.email)
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

  private async throwIfUsernameExists(body: SignUpDto) {
    const existingUser = await this.usersRepo.findByName(body.username)
    if (existingUser) {
      throw new BadRequestException('Username already exists.')
    }
  }

  private async throwIfEmailExists(body: SignUpDto) {
    const existingUser = await this.usersRepo.findByEmail(body.email)
    if (existingUser) {
      throw new BadRequestException('Email already exists.')
    }
  }
}
