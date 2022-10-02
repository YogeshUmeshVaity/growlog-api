import { Injectable, Logger } from '@nestjs/common'
import { DataSource, Repository } from 'typeorm'
import { PasswordRecovery } from './password-recovery.entity'
import { User } from './user.entity'

@Injectable()
export class PasswordRecoveryRepository {
  private readonly repository: Repository<PasswordRecovery>
  private readonly logger = new Logger(PasswordRecoveryRepository.name)

  constructor(private readonly dataSource: DataSource) {
    this.repository = dataSource.getRepository(PasswordRecovery)
  }

  async create(code: string, user: User, expiration: Date) {
    const passwordRecovery = this.repository.create({ code, expiration, user })
    return await this.repository.save(passwordRecovery)
  }

  async delete(recovery: PasswordRecovery) {
    await this.repository.remove(recovery)
  }
}
