import { JwtModule } from '@nestjs/jwt'
import { Test, TestingModule } from '@nestjs/testing'
import { sampleUser } from '../../test/users/fixtures/find-me.fixtures'
import { PasswordRecoveryController } from './password-recovery.controller'
import { PasswordRecoveryService } from './password-recovery.service'

describe('UsersController', () => {
  let passwordRecoveryController: PasswordRecoveryController

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [JwtModule.register(null)],
      controllers: [PasswordRecoveryController],
      providers: [passwordRecoveryServiceMock()]
    }).compile()

    passwordRecoveryController = module.get<PasswordRecoveryController>(
      PasswordRecoveryController
    )
  })

  it('should be defined', () => {
    expect(passwordRecoveryController).toBeDefined()
  })

  describe(`updatePassword`, () => {
    it(`should notify the user that an email has been sent.`, async () => {
      const response = await passwordRecoveryController.recoverPassword({
        email: sampleUser().email
      })
      expect(response).toEqual(
        `A password reset link has been sent to your email.`
      )
    })
  })
})

function passwordRecoveryServiceMock() {
  return {
    provide: PasswordRecoveryService,
    useValue: {
      recover: jest
        .fn()
        .mockResolvedValue('A password reset link has been sent to your email.')
    }
  }
}
