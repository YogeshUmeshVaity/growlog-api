import { BadRequestException } from '@nestjs/common'
import { Test, TestingModule } from '@nestjs/testing'
import { sampleUser } from '../../test/users/fixtures/find-me.fixtures'
import {
  sampleToken,
  userWithConfirmPasswordNoMatch,
  userWithCorrectInfo
} from '../../test/users/fixtures/sign-up.fixtures'
import { AuthService } from '../auth/auth.service'
import { GoogleAuthService } from '../auth/google-auth.service'
import { User } from './user.entity'
import { UsersRepository } from './users.repository'
import { UsersService } from './users.service'

describe('UsersService', () => {
  let usersService: UsersService
  let repository: UsersRepository

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        usersRepositoryMock(),
        authServiceMock(),
        googleAuthServiceMock()
      ]
    }).compile()

    usersService = module.get<UsersService>(UsersService)
    repository = module.get<UsersRepository>(UsersRepository)
  })

  it('should be defined', () => {
    expect(usersService).toBeDefined()
  })

  describe('signUp', () => {
    it(`should return a token when correct user info provided.`, async () => {
      const returnedToken = await usersService.signUp(userWithCorrectInfo)
      expect(returnedToken).toEqual(sampleToken)
    })

    it(`should hash the password when correct user info provided.`, async () => {
      const repositorySpy = jest.spyOn(repository, 'createLocalUser')
      await usersService.signUp(userWithCorrectInfo)
      // Get the argument that createLocalUser() was called with.
      const hashedPassword = repositorySpy.mock.calls[0][0].password
      const providedPassword = userWithCorrectInfo.password
      // Due to random salt, a different hash is generated every time even for the same input.
      // So, we can only check for inequality.
      expect(hashedPassword).not.toEqual(providedPassword)
    })

    it(`should throw when confirm-password doesn't match with password.`, async () => {
      expect.assertions(2)
      try {
        await usersService.signUp(userWithConfirmPasswordNoMatch)
      } catch (error) {
        expect(error).toBeInstanceOf(BadRequestException)
        expect(error).toHaveProperty(
          'message',
          'Confirm Password must match with Password.'
        )
      }
    })

    it(`should throw when username already exists.`, async () => {
      expect.assertions(3)
      repository.findByName = jest.fn().mockResolvedValue(new User())
      try {
        await usersService.signUp(userWithCorrectInfo)
      } catch (error) {
        expect(error).toBeInstanceOf(BadRequestException)
        expect(error).toHaveProperty('message', 'Username already exists.')
        expect(repository.findByName).toBeCalledWith(
          userWithCorrectInfo.username
        )
      }
    })

    it(`should throw when email already exists.`, async () => {
      expect.assertions(3)
      repository.findByEmail = jest.fn().mockResolvedValue(new User())
      try {
        await usersService.signUp(userWithCorrectInfo)
      } catch (error) {
        expect(error).toBeInstanceOf(BadRequestException)
        expect(error).toHaveProperty('message', 'Email already exists.')
        expect(repository.findByEmail).toBeCalledWith(userWithCorrectInfo.email)
      }
    })
  })

  describe('findById', () => {
    it(`should return a user when correct userId provided.`, async () => {
      const returnedUser = await usersService.findById(sampleUser().id)
      expect(returnedUser.id).toEqual(sampleUser().id)
      expect(returnedUser.username).toEqual(sampleUser().username)
    })
  })
})

/**
 * We use functions for representing mocks to avoid singleton const variables. Functions are called
 * every time in the beforeEach() whereas the const variables are singletons and are reused.
 * We want the mocks to be recreated instead of reusing the same instance, before each test.
 *
 * Another reason for using functions is that we can keep all the mock objects at the bottom of the
 * file here because they are less important than the actual test code.
 */
function authServiceMock() {
  return {
    provide: AuthService,
    useValue: {
      logIn: jest.fn().mockResolvedValue(sampleToken)
    }
  }
}

function usersRepositoryMock() {
  return {
    provide: UsersRepository,
    useValue: {
      findByEmail: jest.fn().mockResolvedValue(null),
      findByName: jest.fn().mockResolvedValue(null),
      findById: jest.fn().mockResolvedValue(sampleUser()),
      createLocalUser: jest.fn().mockResolvedValue(userWithCorrectInfo)
    }
  }
}

function googleAuthServiceMock() {
  return {
    provide: GoogleAuthService,
    useValue: {
      getUserData: jest.fn().mockResolvedValue({
        id: 'someId',
        username: 'someUsername',
        email: 'someone@google.com'
      })
    }
  }
}
