import { BadRequestException, Injectable } from '@nestjs/common'
import { User } from './user.entity'
import { UsersRepository } from './users.repository'

@Injectable()
export class UsersService {
  constructor(private readonly usersRepo: UsersRepository) {}

  async updateUsername(user: User, username: string) {
    await this.throwIfUsernameExists(username)
    await this.usersRepo.updateUsername(user.id, username)
  }

  async updateEmail(user: User, email: string) {
    await this.throwIfEmailExists(email)
    await this.usersRepo.updateEmail(user.id, email)
  }

  async findById(userId: string) {
    return await this.usersRepo.findById(userId)
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
