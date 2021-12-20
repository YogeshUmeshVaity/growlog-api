import { BadRequestException } from '@nestjs/common'
import { Test, TestingModule } from '@nestjs/testing'
import {
  signUpWithConfirmPasswordNoMatch,
  signUpWithCorrectInfo
} from '../../test/users/fixtures/sign-up.fixtures'
import { AuthService } from '../auth/auth.service'
import { User } from './user.entity'
import { UsersRepository } from './users.repository'
import { UsersService } from './users.service'

const sampleToken = { token: 'SomeBigTextJwtToken' }

describe('UsersService', () => {
  let usersService: UsersService
  let repository: UsersRepository
  let authService: AuthService

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: UsersRepository,
          useValue: {
            findByEmail: jest.fn().mockResolvedValue(null),
            findByName: jest.fn().mockResolvedValue(null),
            createAndSave: jest.fn().mockResolvedValue(signUpWithCorrectInfo)
          }
        },
        {
          provide: AuthService,
          useValue: {
            logIn: jest.fn().mockResolvedValue(sampleToken)
          }
        }
      ]
    }).compile()

    usersService = module.get<UsersService>(UsersService)
    repository = module.get<UsersRepository>(UsersRepository)
    authService = module.get<AuthService>(AuthService)
  })

  it('should be defined', () => {
    expect(usersService).toBeDefined()
  })

  describe('sign-up', () => {
    it(`should return a token when correct user info provided.`, async () => {
      const returnedToken = await usersService.signUp(signUpWithCorrectInfo)
      expect(returnedToken).toEqual(sampleToken)
      //expect(repository.createAndSave).toBeCalledWith(signUpWithCorrectInfo)
      expect(authService.logIn).toBeCalledWith(signUpWithCorrectInfo)
    })

    it(`should throw when confirm-password doesn't match with password.`, async () => {
      expect.assertions(2)
      try {
        await usersService.signUp(signUpWithConfirmPasswordNoMatch)
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
        await usersService.signUp(signUpWithCorrectInfo)
      } catch (error) {
        expect(error).toBeInstanceOf(BadRequestException)
        expect(error).toHaveProperty('message', 'Username already exists.')
        expect(repository.findByName).toBeCalledWith(
          signUpWithCorrectInfo.username
        )
      }
    })
  })
})
