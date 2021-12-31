import { createConnection, getConnection } from 'typeorm'
import { userWithCorrectInfo as testUser } from '../../test/users/fixtures/sign-up.fixtures'
import { User } from './user.entity'
import { UsersRepository } from './users.repository'

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
      const savedUser = await usersRepository.createAndSave(testUser)
      const fetchedUser = await usersRepository.findById(savedUser.id)
      expect(savedUser.id).toEqual(fetchedUser.id)
    })

    it(`should return undefined when the user doesn't exist in database.`, async () => {
      const fetchedUser = await usersRepository.findById('Some-Non-Existent-Id')
      expect(fetchedUser).toBeUndefined()
    })
  })

  describe('findByEmail', () => {
    it(`should return the user when the user exists in database.`, async () => {
      await usersRepository.createAndSave(testUser)
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
      await usersRepository.createAndSave(testUser)
      const fetchedUser = await usersRepository.findByName(testUser.username)
      expect(fetchedUser.username).toEqual(testUser.username)
    })

    it(`should return the user when the user exists in database.`, async () => {
      const fetchedUser = await usersRepository.findByName(testUser.username)
      expect(fetchedUser).toBeUndefined()
    })
  })

  describe('createAndSave', () => {
    it(`should create and save the user in database.`, async () => {
      const savedUser = await usersRepository.createAndSave(testUser)
      const fetchedUser = await usersRepository.findByEmail(testUser.email)
      expect(savedUser.id).toEqual(fetchedUser.id)
    })
  })
})
