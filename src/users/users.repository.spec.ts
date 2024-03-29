import { DataSource } from 'typeorm'
import { sampleUser } from '../../test/users/fixtures/find-me.fixtures'
import {
  expiration,
  recoveryCode
} from '../../test/password-recovery/fixtures/recover-password.fixtures'
import { userWithCorrectInfo as testUser } from '../../test/auth/fixtures/sign-up.fixtures'
import { correctPasswords } from '../../test/auth/fixtures/update-password.fixtures'
import { createInMemoryDataSource } from '../../test/utils/in-memory-database'
import { PasswordRecoveryRepository } from '../password-recovery/password-recovery.repository'
import { UsersRepository } from './users.repository'

describe('UsersRepository', () => {
  let usersRepository: UsersRepository
  let passwordRecoveryRepository: PasswordRecoveryRepository
  let dataSource: DataSource

  beforeEach(async () => {
    dataSource = createInMemoryDataSource()
    await dataSource.initialize()
    usersRepository = new UsersRepository(dataSource)
    passwordRecoveryRepository = new PasswordRecoveryRepository(dataSource)
  })

  afterEach(async () => {
    await dataSource.destroy()
  })

  it('should be defined.', () => {
    expect(usersRepository).toBeDefined()
  })

  describe('findById', () => {
    it(`should return the user when the user exists in database.`, async () => {
      const savedUser = await usersRepository.createLocalUser(testUser)
      const fetchedUser = await usersRepository.findById(savedUser.id)
      expect(fetchedUser.id).toEqual(savedUser.id)
    })

    it(`should return null when the user doesn't exist in database.`, async () => {
      const fetchedUser = await usersRepository.findById('Some-Non-Existent-Id')
      expect(fetchedUser).toBeNull()
    })
  })

  describe('findByGoogleId', () => {
    it(`should return the user when the user exists in database.`, async () => {
      const googleUser = await usersRepository.createGoogleUser(
        sampleUser().googleId,
        sampleUser().username,
        sampleUser().email
      )
      const fetchedUser = await usersRepository.findByGoogleId(
        googleUser.googleId
      )
      expect(fetchedUser.id).toEqual(googleUser.id)
    })

    it(`should return null when the user doesn't exist in database.`, async () => {
      const fetchedUser = await usersRepository.findByGoogleId(
        sampleUser().googleId
      )
      expect(fetchedUser).toBeNull()
    })
  })

  describe('findByEmail', () => {
    it(`should return the user when the user exists in database.`, async () => {
      await usersRepository.createLocalUser(testUser)
      const fetchedUser = await usersRepository.findByEmail(testUser.email)
      expect(fetchedUser.email).toEqual(testUser.email)
    })

    it(`should return null when the user doesn't exist in database.`, async () => {
      const fetchedUser = await usersRepository.findByEmail(testUser.email)
      expect(fetchedUser).toBeNull()
    })
  })

  describe('findByEmailWithRecovery', () => {
    it(`should return the user with password recovery object.`, async () => {
      const existingUser = await usersRepository.createLocalUser(testUser)
      const inputRecovery = await passwordRecoveryRepository.create(
        recoveryCode,
        existingUser,
        expiration
      )
      const userWithRecovery = await usersRepository.findByEmailWithRecovery(
        testUser.email
      )
      expect(inputRecovery).toEqual(
        expect.objectContaining(userWithRecovery.passwordRecovery)
      )
    })

    it(`should return null when the user doesn't exist in database.`, async () => {
      const fetchedUser = await usersRepository.findByEmailWithRecovery(
        testUser.email
      )
      expect(fetchedUser).toBeNull()
    })
  })

  describe('findByName', () => {
    it(`should return the user when the user exists in database.`, async () => {
      await usersRepository.createLocalUser(testUser)
      const fetchedUser = await usersRepository.findByName(testUser.username)
      expect(fetchedUser.username).toEqual(testUser.username)
    })

    it(`should return null when the user doesn't exist in database.`, async () => {
      const fetchedUser = await usersRepository.findByName(testUser.username)
      expect(fetchedUser).toBeNull()
    })
  })

  describe('createLocalUser', () => {
    it(`should create and save the user in database.`, async () => {
      const savedUser = await usersRepository.createLocalUser(testUser)
      const fetchedUser = await usersRepository.findByEmail(testUser.email)
      expect(savedUser.id).toEqual(fetchedUser.id)
    })
  })

  describe('updateEmail', () => {
    it(`should update the email in the database.`, async () => {
      const existingUser = await usersRepository.createLocalUser(testUser)
      const newEmail = 'new-email@gmail.com'
      await usersRepository.updateEmail(existingUser.id, newEmail)
      const updatedUser = await usersRepository.findByEmail(newEmail)
      expect(updatedUser.email).toEqual(newEmail)
      expect(updatedUser.email).not.toEqual(testUser.email)
    })
  })

  describe('updateUsername', () => {
    it(`should update the username in the database.`, async () => {
      const existingUser = await usersRepository.createLocalUser(testUser)
      const newUsername = 'someNewUsername'
      await usersRepository.updateUsername(existingUser.id, newUsername)
      const updatedUser = await usersRepository.findByName(newUsername)
      expect(updatedUser.username).toEqual(newUsername)
      expect(updatedUser.username).not.toEqual(testUser.username)
    })
  })

  describe('updatePassword', () => {
    it(`should update the password in the database.`, async () => {
      const existingUser = await usersRepository.createLocalUser(testUser)
      const oldPassword = testUser.password
      const newPassword = correctPasswords.newPassword
      await usersRepository.updatePassword(existingUser.id, newPassword)
      const updatedUser = await usersRepository.findByName(
        existingUser.username
      )
      expect(updatedUser.hashedPassword).toEqual(newPassword)
      expect(updatedUser.hashedPassword).not.toEqual(oldPassword)
    })
  })

  describe('updateUser', () => {
    it(`should update the given user in the database.`, async () => {
      // add new user
      const userToUpdate = await usersRepository.createLocalUser(testUser)

      // update user
      userToUpdate.username = 'newUserName'
      userToUpdate.email = 'new@email.com'
      await usersRepository.update(userToUpdate)

      const updatedUser = await usersRepository.findById(userToUpdate.id)
      expect(updatedUser.username).toEqual('newUserName')
      expect(updatedUser.email).toEqual('new@email.com')
    })
  })
})
