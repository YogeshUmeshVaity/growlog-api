import { Injectable } from '@nestjs/common'
import { DataSource, Repository } from 'typeorm'
import { User } from '../users/user.entity'
import { PasswordRecovery } from './password-recovery.entity'

@Injectable()
export class PasswordRecoveryRepository {
  private readonly repository: Repository<PasswordRecovery>

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
