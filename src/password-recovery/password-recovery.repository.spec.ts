import { DataSource } from 'typeorm'
import {
  expiration,
  recoveryCode
} from '../../test/password-recovery/fixtures/recover-password.fixtures'
import { createInMemoryDataSource } from '../../test/utils/in-memory-database'
import { UsersRepository } from '../users/users.repository'
import { PasswordRecovery } from './password-recovery.entity'
import { PasswordRecoveryRepository } from './password-recovery.repository'
import { userWithCorrectInfo as userInfo } from '../../test/users/fixtures/sign-up.fixtures'
import { User } from '../users/user.entity'

describe('PasswordRecoveryRepository', () => {
  let passwordRecoveryRepository: PasswordRecoveryRepository
  let usersRepository: UsersRepository
  let dataSource: DataSource
  let user: User

  beforeEach(async () => {
    dataSource = createInMemoryDataSource()
    await dataSource.initialize()
    passwordRecoveryRepository = new PasswordRecoveryRepository(dataSource)
    usersRepository = new UsersRepository(dataSource)
    user = await usersRepository.createLocalUser(userInfo) // we need this in each test
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
        user,
        expiration
      )
      expect(passwordRecovery).toBeInstanceOf(PasswordRecovery)
    })
  })

  describe('delete', () => {
    it(`should delete the password recovery in the database.`, async () => {
      const createdRecovery = await passwordRecoveryRepository.create(
        recoveryCode,
        user,
        expiration
      )
      const deletedRecovery = await passwordRecoveryRepository.delete(
        createdRecovery
      )
      expect(deletedRecovery).toEqual(createdRecovery)
    })
  })

  describe('findByCode', () => {
    it(`should find a password recovery by the given recovery code.`, async () => {
      const createdRecovery = await passwordRecoveryRepository.create(
        recoveryCode,
        user,
        expiration
      )
      const foundRecovery = await passwordRecoveryRepository.findByCode(
        recoveryCode
      )
      expect(foundRecovery).toEqual(createdRecovery)
    })
  })
})
