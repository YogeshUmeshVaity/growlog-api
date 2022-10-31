import { JwtModule } from '@nestjs/jwt'
import { Test, TestingModule } from '@nestjs/testing'
import { validCode } from '../../test/password-recovery/fixtures/validate-code.fixtures'
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

  describe(`recoverPassword`, () => {
    it(`should send the password recovery code via email.`, async () => {
      const response = await passwordRecoveryController.recoverPassword({
        email: sampleUser().email
      })
      expect(response).toEqual(
        `A password reset link has been sent to your email.`
      )
    })
  })

  describe(`validateCode`, () => {
    it(`should check if the recovery code provided by user is valid.`, async () => {
      const response = await passwordRecoveryController.validateCode(validCode)
      expect(response.recoveryCode).toEqual(validCode.recoveryCode)
    })
  })
})

function passwordRecoveryServiceMock() {
  return {
    provide: PasswordRecoveryService,
    useValue: {
      recover: jest
        .fn()
        .mockResolvedValue(
          'A password reset link has been sent to your email.'
        ),
      validateCode: jest.fn().mockResolvedValue(validCode)
    }
  }
}
