import { DataSource } from 'typeorm'
import { PasswordRecovery } from '../../src/password-recovery/password-recovery.entity'
import { User } from '../../src/users/user.entity'

const testConnection = 'testConnection'

export function createInMemoryDataSource() {
  return new DataSource({
    type: 'sqlite',
    database: ':memory:',
    dropSchema: true,
    entities: [User, PasswordRecovery],
    synchronize: true,
    logging: false,
    name: testConnection
  })
}
