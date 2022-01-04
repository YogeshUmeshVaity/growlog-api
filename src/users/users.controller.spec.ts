import { Test, TestingModule } from '@nestjs/testing'
import {
  sampleToken,
  userWithCorrectInfo as user
} from '../../test/users/fixtures/sign-up.fixtures'
import { UsersController } from './users.controller'
import { UsersService } from './users.service'

describe('UsersController', () => {
  let usersController: UsersController
  let usersService: UsersService

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        {
          provide: UsersService,
          useValue: {
            signUp: jest.fn().mockResolvedValue(sampleToken)
          }
        }
      ]
    }).compile()

    usersController = module.get<UsersController>(UsersController)
    usersService = module.get<UsersService>(UsersService)
  })

  it('should be defined', () => {
    expect(usersController).toBeDefined()
  })

  describe(`signUp`, () => {
    it(`should return a token when correct user info provided.`, async () => {
      const returnedToken = await usersController.signUp(user)
      expect(returnedToken).toEqual(sampleToken)
      expect(usersService.signUp).toBeCalledWith(user)
    })
  })
})
