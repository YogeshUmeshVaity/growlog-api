import { Test, TestingModule } from '@nestjs/testing'
import { sampleUser } from '../../test/users/fixtures/find-me.fixtures'
import { sampleToken } from '../../test/auth/fixtures/sign-up.fixtures'
import { correctPasswords } from '../../test/auth/fixtures/update-password.fixtures'
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
      controllers: [UsersController],
      providers: [
        {
          provide: UsersService,
          useValue: {
            signUp: jest.fn().mockResolvedValue(sampleToken),
            login: jest.fn().mockResolvedValue(sampleToken),
            loginWithGoogle: jest.fn().mockResolvedValue(sampleToken),
            logoutOtherDevices: jest.fn().mockResolvedValue(sampleToken),
            updateUsername: jest.fn(),
            updateEmail: jest.fn(),
            updatePassword: jest.fn()
          }
        },
        {
          provide: AuthService,
          useValue: {
            verifyTokenFor: jest.fn().mockResolvedValue({})
          }
        }
      ]
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({
        canActivate: jest.fn().mockResolvedValue(true)
      })
      .compile()

    usersController = module.get<UsersController>(UsersController)
    usersService = module.get<UsersService>(UsersService)
  })

  it('should be defined', () => {
    expect(usersController).toBeDefined()
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

  describe(`updateUsername`, () => {
    it(`should update the username when it doesn't already exist.`, async () => {
      const user = sampleUser()
      const newUsername = 'SomeNewName'
      await usersController.updateUsername(user, newUsername)
      expect(usersService.updateUsername).toBeCalledWith(user, newUsername)
    })
  })

  describe(`updateEmail`, () => {
    it(`should update the email when it doesn't already exist.`, async () => {
      const user = sampleUser()
      const newEmail = 'newEmail@gmail.com'
      await usersController.updateEmail(user, newEmail)
      expect(usersService.updateEmail).toBeCalledWith(user, newEmail)
    })
  })
})
