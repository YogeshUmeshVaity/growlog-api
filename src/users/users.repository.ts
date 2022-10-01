import { Injectable, Logger } from '@nestjs/common'
import { DataSource, Repository } from 'typeorm'
import { SignUpDto } from './dtos/signup-user.dto'
import { User } from './user.entity'

/**
 * Performs queries on database for the User entity.
 */
@Injectable()
// We avoid extending from Repository<User>, because we want to avoid all the unnecessary methods
// that come from the Repository<User>. We prefer composition over inheritance.
export class UsersRepository {
  private readonly logger = new Logger(UsersRepository.name)
  private readonly repository: Repository<User>

  constructor(private readonly dataSource: DataSource) {
    this.repository = dataSource.getRepository(User)
  }

  async findById(userId: string): Promise<User> {
    return await this.repository.findOne({ where: { id: userId } })
  }

  async findByGoogleId(googleId: string): Promise<User> {
    return await this.repository.findOne({ where: { googleId } })
  }

  async findByEmail(email: string): Promise<User> {
    return await this.repository.findOne({ where: { email } })
  }

  async findByEmailWithRecovery(email: string): Promise<User> {
    return await this.repository.findOne({
      where: { email: email },
      relations: ['passwordRecovery']
    })
  }

  async findByName(username: string): Promise<User> {
    return await this.repository.findOne({ where: { username } })
  }

  async updateEmail(userId: string, newEmail: string) {
    await this.repository.update({ id: userId }, { email: newEmail })
  }

  async updateUsername(userId: string, username: string) {
    await this.repository.update({ id: userId }, { username: username })
  }

  async updatePassword(userId: string, hashedPassword: string) {
    await this.repository.update(
      { id: userId },
      { hashedPassword: hashedPassword }
    )
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
