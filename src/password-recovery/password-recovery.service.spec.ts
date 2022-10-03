import { NotFoundException } from '@nestjs/common'
import { Test, TestingModule } from '@nestjs/testing'
import { configServiceMock } from '../../test/common-mocks/config-service.mock'
import { sampleUser } from '../../test/users/fixtures/find-me.fixtures'
import { userWithRecovery } from '../../test/users/fixtures/recover-password.fixtures'
import { userWithCorrectInfo } from '../../test/users/fixtures/sign-up.fixtures'
import { EmailService } from '../email-service/email.service'
import { PasswordRecovery } from '../password-recovery/password-recovery.entity'
import { PasswordRecoveryRepository } from '../password-recovery/password-recovery.repository'
import { UsersRepository } from '../users/users.repository'
import { PasswordRecoveryService } from './password-recovery.service'

describe('PasswordRecoveryService', () => {
  let passwordRecoveryService: PasswordRecoveryService
  let emailService: EmailService
  let usersRepository: UsersRepository
  let passwordRecoveryRepository: PasswordRecoveryRepository

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PasswordRecoveryService,
        usersRepositoryMock(),
        passwordRecoveryRepositoryMock(),
        emailServiceMock(),
        configServiceMock()
      ]
    }).compile()

    usersRepository = module.get<UsersRepository>(UsersRepository)
    emailService = module.get<EmailService>(EmailService)
    passwordRecoveryService = module.get<PasswordRecoveryService>(
      PasswordRecoveryService
    )
    passwordRecoveryRepository = module.get<PasswordRecoveryRepository>(
      PasswordRecoveryRepository
    )
  })

  it('should be defined', () => {
    expect(passwordRecoveryService).toBeDefined()
  })

  describe(`recover`, () => {
    it(`should send a recovery email.`, async () => {
      await passwordRecoveryService.recover(sampleUser().email)
      expect(emailService.sendEmail).toBeCalled()
    })

    it(`should notify the user that an email has been sent.`, async () => {
      const response = await passwordRecoveryService.recover(sampleUser().email)
      expect(response).toEqual(
        'A password reset link has been sent to your email.'
      )
    })

    it(`should throw when no user is found by the given email.`, async () => {
      usersRepository.findByEmailWithRecovery = jest
        .fn()
        .mockResolvedValue(null)
      expect.assertions(2)
      try {
        await passwordRecoveryService.recover(sampleUser().email)
      } catch (error) {
        expect(error).toBeInstanceOf(NotFoundException)
        expect(error).toHaveProperty(
          'message',
          `There's no user by this email.`
        )
      }
    })

    it(`should delete the previous recovery when it exists.`, async () => {
      usersRepository.findByEmailWithRecovery = jest
        .fn()
        .mockResolvedValue(userWithRecovery())
      await passwordRecoveryService.recover(sampleUser().email)
      expect(passwordRecoveryRepository.delete).toBeCalled()
    })
  })
})

function passwordRecoveryRepositoryMock() {
  return {
    provide: PasswordRecoveryRepository,
    useValue: {
      delete: jest.fn().mockResolvedValue({}),
      create: jest.fn().mockResolvedValue(new PasswordRecovery())
    }
  }
}

function emailServiceMock() {
  return {
    provide: EmailService,
    useValue: {
      sendEmail: jest.fn().mockResolvedValue({})
    }
  }
}

function usersRepositoryMock() {
  return {
    provide: UsersRepository,
    useValue: {
      findByEmail: jest.fn().mockResolvedValue(undefined),
      findByEmailWithRecovery: jest.fn().mockResolvedValue(sampleUser),
      findByName: jest.fn().mockResolvedValue(undefined),
      findById: jest.fn().mockResolvedValue(sampleUser()),
      findByGoogleId: jest.fn().mockResolvedValue(sampleUser()),
      createLocalUser: jest.fn().mockResolvedValue(userWithCorrectInfo),
      createGoogleUser: jest.fn().mockResolvedValue(sampleUser()),
      updateEmail: jest.fn(),
      updateUsername: jest.fn().mockResolvedValue({}),
      updatePassword: jest.fn().mockResolvedValue({}),
      update: jest.fn()
    }
  }
}
