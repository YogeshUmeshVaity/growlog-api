import { Injectable, Logger } from '@nestjs/common'
import { DataSource, Repository } from 'typeorm'
import { PasswordRecovery } from './password-recovery.entity'
import { User } from '../users/user.entity'

@Injectable()
export class PasswordRecoveryRepository {
  private readonly repository: Repository<PasswordRecovery>
  private readonly logger = new Logger(PasswordRecoveryRepository.name)

  constructor(private readonly dataSource: DataSource) {
    this.repository = dataSource.getRepository(PasswordRecovery)
  }

  async create(code: string, user: User, expiryTime: Date) {
    const passwordRecovery = this.repository.create({
      code,
      expiration: expiryTime,
      user
    })
    return await this.repository.save(passwordRecovery)
  }

  async delete(recovery: PasswordRecovery) {
    return await this.repository.remove(recovery)
  }

  async findByCode(code: string) {
    return await this.repository.findOne({
      where: { code: code }
    })
  }
}
