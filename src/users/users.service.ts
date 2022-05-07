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
    private readonly usersRepository: UsersRepository,
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
    const googleUser = await this.googleService.getUserData(googleAccessToken)
    const existingUser = await this.usersRepository.findByGoogleId(
      googleUser.id
    )

    if (existingUser) {
      this.updateEmailIfChanged(existingUser, googleUser)
      return await this.authService.logIn(existingUser)
    }

    const newUser = await this.createNewGoogleUser(googleUser)
    return await this.authService.logIn(newUser)
  }

  private async createNewGoogleUser(googleUser: GoogleUser) {
    await this.throwIfEmailAlreadyExists(googleUser)
    const username = await this.generateUniqueUsername(googleUser.name)
    return await this.usersRepository.createGoogleUser(
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
    if (!(await this.usersRepository.findByName(name))) {
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
    if (await this.usersRepository.findByEmail(googleUser.email)) {
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
      !(await this.usersRepository.findByEmail(googleUser.email))
    ) {
      this.usersRepository.updateEmail(existingUser.id, googleUser.email)
    }
  }

  async findById(userId: string) {
    return await this.usersRepository.findById(userId)
  }

  private async saveToDb(userInfo: SignUpDto) {
    return await this.usersRepository.createLocalUser(userInfo)
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
    const existingUser = await this.usersRepository.findByName(body.username)
    if (existingUser) {
      throw new BadRequestException('Username already exists.')
    }
  }

  private async throwIfEmailExists(body: SignUpDto) {
    const existingUser = await this.usersRepository.findByEmail(body.email)
    if (existingUser) {
      throw new BadRequestException('Email already exists.')
    }
  }
}
