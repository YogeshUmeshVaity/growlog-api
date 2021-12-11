import { AbstractRepository, Entity, EntityRepository } from 'typeorm'
import { User } from './user.entity'

@EntityRepository(User)
export class UsersRepository extends AbstractRepository<User> {
  async createAndSave() {
    const user = this.repository.create({
      username: 'test',
      email: 'test@test.com',
      tokenInvalidator: 'abc',
    })
    return await this.repository.save(user)
  }
}
