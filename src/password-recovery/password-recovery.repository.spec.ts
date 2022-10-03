import { DataSource } from 'typeorm'
import { sampleUser } from '../../test/users/fixtures/find-me.fixtures'
import {
  expiration,
  recoveryCode
} from '../../test/users/fixtures/recover-password.fixtures'
import { createInMemoryDataSource } from '../../test/utils/in-memory-database'
import { PasswordRecovery } from './password-recovery.entity'
import { PasswordRecoveryRepository } from './password-recovery.repository'

describe('PasswordRecoveryRepository', () => {
  let passwordRecoveryRepository: PasswordRecoveryRepository
  let dataSource: DataSource

  beforeEach(async () => {
    dataSource = createInMemoryDataSource()
    await dataSource.initialize()
    passwordRecoveryRepository = new PasswordRecoveryRepository(dataSource)
  })

  afterEach(async () => {
    await dataSource.destroy()
  })

  it('should be defined.', () => {
    expect(passwordRecoveryRepository).toBeDefined()
  })

  describe('create', () => {
    it(`should create and save the password recovery in the database.`, async () => {
      const passwordRecovery = await passwordRecoveryRepository.create(
        recoveryCode,
        sampleUser(),
        expiration
      )
      expect(passwordRecovery).toBeInstanceOf(PasswordRecovery)
    })
  })

  describe('delete', () => {
    it(`should delete the password recovery in the database.`, async () => {
      const createdRecovery = await passwordRecoveryRepository.create(
        recoveryCode,
        sampleUser(),
        expiration
      )
      const deletedRecovery = await passwordRecoveryRepository.delete(
        createdRecovery
      )
      expect(deletedRecovery).toEqual(createdRecovery)
    })
  })
})
