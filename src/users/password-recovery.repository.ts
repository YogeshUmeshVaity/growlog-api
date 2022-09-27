import { Logger } from '@nestjs/common'
import { AbstractRepository, EntityRepository } from 'typeorm'
import { PasswordRecovery } from './password-recovery.entity'
import { User } from './user.entity'

@EntityRepository(PasswordRecovery)
export class PasswordRecoveryRepository extends AbstractRepository<PasswordRecovery> {
  private readonly logger = new Logger(PasswordRecoveryRepository.name)

  async delete(recovery: PasswordRecovery) {
    await this.repository.remove(recovery)
  }

  async create(code: string, user: User, expiration: Date) {
    const passwordRecovery = this.repository.create({ code, expiration, user })
    return await this.repository.save(passwordRecovery)
  }
}
