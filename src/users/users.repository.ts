import { Logger } from '@nestjs/common'
import { AbstractRepository, EntityRepository } from 'typeorm'
import { SignUpDto } from './dtos/signup-user.dto'
import { User } from './user.entity'

@EntityRepository(User)
export class UsersRepository extends AbstractRepository<User> {
  private readonly logger = new Logger(UsersRepository.name)

  async findByEmail(email: string): Promise<User> {
    return await this.repository.findOne({ email })
  }

  async findByName(username: string): Promise<User> {
    return await this.repository.findOne({ username })
  }

  async createAndSave(userInfo: SignUpDto): Promise<User> {
    const user = this.repository.create({
      username: userInfo.username,
      email: userInfo.email,
      hashedPassword: userInfo.password
    })
    user.renewTokenInvalidator()
    return await this.repository.save(user)
  }
}
