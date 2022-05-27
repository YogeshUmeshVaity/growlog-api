import { Logger } from '@nestjs/common'
import { AbstractRepository, EntityRepository } from 'typeorm'
import { SignUpDto } from './dtos/signup-user.dto'
import { User } from './user.entity'

@EntityRepository(User)
export class UsersRepository extends AbstractRepository<User> {
  private readonly logger = new Logger(UsersRepository.name)

  async findById(userId: string): Promise<User> {
    return await this.repository.findOne(userId)
  }

  async findByGoogleId(googleId: string): Promise<User> {
    return await this.repository.findOne({ googleId })
  }

  async findByEmail(email: string): Promise<User> {
    return await this.repository.findOne({ email })
  }

  async findByName(username: string): Promise<User> {
    return await this.repository.findOne({ username })
  }

  async updateEmail(userId: string, newEmail: string) {
    await this.repository.update({ id: userId }, { email: newEmail })
  }

  async updateUsername(userId: string, username: string) {
    await this.repository.update({ id: userId }, { username: username })
  }

  async update(user: User) {
    await this.repository.update({ id: user.id }, user)
  }

  async createLocalUser(userInfo: SignUpDto): Promise<User> {
    const user = this.repository.create({
      username: userInfo.username,
      email: userInfo.email,
      hashedPassword: userInfo.password
    })
    user.invalidateAllTokens()
    return await this.repository.save(user)
  }

  async createGoogleUser(
    googleId: string,
    username: string,
    email: string
  ): Promise<User> {
    const user = this.repository.create({
      googleId,
      username,
      email
    })
    user.invalidateAllTokens()
    return await this.repository.save(user)
  }
}
