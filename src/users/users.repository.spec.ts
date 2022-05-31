import { createConnection, getConnection } from 'typeorm'
import { sampleUser } from '../../test/users/fixtures/find-me.fixtures'
import { userWithCorrectInfo as testUser } from '../../test/users/fixtures/sign-up.fixtures'
import { correctPasswords } from '../../test/users/fixtures/update-password.fixtures'
import { User } from './user.entity'
import { UsersRepository } from './users.repository'
import * as bcrypt from 'bcrypt'

const testConnection = 'testConnection'

describe('UsersRepository', () => {
  let usersRepository: UsersRepository

  beforeEach(async () => {
    const connection = await createConnection({
      type: 'sqlite',
      database: ':memory:',
      dropSchema: true,
      entities: [User],
      synchronize: true,
      logging: false,
      name: testConnection
    })

    usersRepository = connection.getCustomRepository(UsersRepository)
  })

  afterEach(async () => {
    await getConnection(testConnection).close()
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

    it(`should return undefined when the user doesn't exist in database.`, async () => {
      const fetchedUser = await usersRepository.findById('Some-Non-Existent-Id')
      expect(fetchedUser).toBeUndefined()
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

    it(`should return undefined when the user doesn't exist in database.`, async () => {
      const fetchedUser = await usersRepository.findByGoogleId(
        sampleUser().googleId
      )
      expect(fetchedUser).toBeUndefined()
    })
  })

  describe('findByEmail', () => {
    it(`should return the user when the user exists in database.`, async () => {
      await usersRepository.createLocalUser(testUser)
      const fetchedUser = await usersRepository.findByEmail(testUser.email)
      expect(fetchedUser.email).toEqual(testUser.email)
    })

    it(`should return undefined when the user doesn't exist in database.`, async () => {
      const fetchedUser = await usersRepository.findByEmail(testUser.email)
      expect(fetchedUser).toBeUndefined()
    })
  })

  describe('findByName', () => {
    it(`should return the user when the user exists in database.`, async () => {
      await usersRepository.createLocalUser(testUser)
      const fetchedUser = await usersRepository.findByName(testUser.username)
      expect(fetchedUser.username).toEqual(testUser.username)
    })

    it(`should return undefined when the user doesn't exist in database.`, async () => {
      const fetchedUser = await usersRepository.findByName(testUser.username)
      expect(fetchedUser).toBeUndefined()
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
