import { BadRequestException, Injectable, Logger } from '@nestjs/common'
import { SignUpDto } from './dtos/signup-user.dto'
import { UsersRepository } from './users.repository'
import * as bcrypt from 'bcrypt'
import { AuthService } from '../auth/auth.service'

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name)
  constructor(
    private readonly usersRepository: UsersRepository,
    private readonly authService: AuthService
  ) {}

  async signUp(userInfo: SignUpDto) {
    this.throwIfConfirmPasswordNotEqual(userInfo)
    await this.throwIfUsernameExists(userInfo)
    await this.throwIfEmailExists(userInfo)
    const hashedUser = await this.hashThePassword(userInfo)
    const newUser = await this.saveToDb(hashedUser)
    return await this.authService.logIn(newUser)
  }

  private async saveToDb(userInfo: SignUpDto) {
    return await this.usersRepository.createAndSave(userInfo)
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
