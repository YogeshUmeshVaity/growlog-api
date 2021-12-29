import { createConnection, getConnection } from 'typeorm'
import { userWithCorrectInfo as user } from '../../test/users/fixtures/sign-up.fixtures'
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

  describe('findByEmail', () => {
    it(`should return the user when the user exists in database.`, async () => {
      await usersRepository.createAndSave(user)
      const fetchedUser = await usersRepository.findByEmail('test1@test.com')
      expect(fetchedUser.email).toEqual(user.email)
      expect(fetchedUser.username).toEqual(user.username)
    })
  })

  describe('findByEmail', () => {
    it(`should return undefined when the user doesn't exist in database.`, async () => {
      const fetchedUser = await usersRepository.findByEmail('test1@test.com')
      expect(fetchedUser).toBeUndefined()
    })
  })
})
