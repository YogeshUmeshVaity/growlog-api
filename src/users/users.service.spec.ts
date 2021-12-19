import { BadRequestException } from '@nestjs/common'
import { Test, TestingModule } from '@nestjs/testing'
import {
  signUpWithConfirmPasswordNoMatch,
  signUpWithCorrectInfo
} from '../../test/users/fixtures/sign-up.fixtures'
import { AuthService } from '../auth/auth.service'
import { UsersRepository } from './users.repository'
import { UsersService } from './users.service'

describe('UsersService', () => {
  let usersService: UsersService
  let repository: UsersRepository

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: UsersRepository,
          useValue: {
            findByEmail: jest.fn().mockResolvedValue(null),
            findByName: jest.fn().mockResolvedValue(null),
            createAndSave: jest.fn().mockResolvedValue({})
          }
        },
        {
          provide: AuthService,
          useValue: {
            logIn: jest.fn().mockResolvedValue({ token: '' })
          }
        }
      ]
    }).compile()

    usersService = module.get<UsersService>(UsersService)
    repository = module.get<UsersRepository>(UsersRepository)
  })

  it('should be defined', () => {
    expect(usersService).toBeDefined()
  })

  describe('sign-up', () => {
    it(`should return a token when correct user info provided.`, async () => {
      const token = await usersService.signUp(signUpWithCorrectInfo)
      expect(token).toHaveProperty('token')
    })

    it(`should throw when confirm password doesn't match with password.`, async () => {
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
  })
})
