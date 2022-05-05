import { JwtModule } from '@nestjs/jwt'
import { Test, TestingModule } from '@nestjs/testing'
import { sampleUser } from '../../test/users/fixtures/find-me.fixtures'
import {
  sampleToken,
  userWithCorrectInfo as user
} from '../../test/users/fixtures/sign-up.fixtures'
import { isGuarded } from '../../test/utils/is-guarded'
import { AuthService } from '../auth/auth.service'
import { JwtAuthGuard } from '../auth/jwt-auth.guard'
import { UsersController } from './users.controller'
import { UsersService } from './users.service'

describe('UsersController', () => {
  let usersController: UsersController
  let usersService: UsersService

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [JwtModule.register(null)],
      controllers: [UsersController],
      providers: [
        {
          provide: UsersService,
          useValue: {
            signUp: jest.fn().mockResolvedValue(sampleToken)
          }
        },
        {
          provide: AuthService,
          useValue: {
            verifyTokenFor: jest.fn().mockResolvedValue({})
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

  describe(`findMe`, () => {
    it(`should be protected with JwtAuthGuard.`, async () => {
      expect(isGuarded(UsersController.prototype.findMe, JwtAuthGuard)).toBe(
        true
      )
    })

    it(`should return a user.`, async () => {
      const returnedUser = usersController.findMe(sampleUser())
      expect(returnedUser.id).toEqual(sampleUser().id)
      expect(returnedUser.username).toEqual(sampleUser().username)
    })
  })
})
