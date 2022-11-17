import { INestApplication } from '@nestjs/common'
import { Test, TestingModule } from '@nestjs/testing'
import * as request from 'supertest'
import { DataSource, QueryFailedError } from 'typeorm'
import { AppModule } from '../../src/app.module'
import { EmailService } from '../../src/email-service/email.service'
import { RECOVERY_CODE_LENGTH } from '../../src/password-recovery/dtos/validate-code.dto'
import { PasswordRecoveryRepository } from '../../src/password-recovery/password-recovery.repository'
import { MIN_LENGTH_PASSWORD } from '../../src/users/dtos/signup-user.dto'
import { mockGoogleAuthUserData } from '../common-mocks/google-auth-service.mock'
import { EmptyLogger } from '../common-mocks/logger.mock'
import { sampleUser as googleUser } from '../users/fixtures/find-me.fixtures'
import {
  sampleToken,
  userWithCorrectInfo as userInfo
} from '../users/fixtures/sign-up.fixtures'
import { clearDb, messageFrom } from '../utils/test.utils'
import { shortRecoveryCode } from './fixtures/recover-password.fixtures'
import {
  mismatchedPasswordsWith,
  noSpecialCharPasswordsWith,
  oldPasswordsWith,
  shortPasswordsWith,
  validPasswords,
  validPasswordsWith
} from './fixtures/reset-password.fixtures'
import {
  expiryMinutes,
  forwardSystemTimeOnceBy,
  invalidCode
} from './fixtures/validate-code.fixtures'
import {
  getRecoveryCodeFrom,
  spyOnEmailService
} from './utils/recover-password.utils'

describe(`PasswordRecoveryModule`, () => {
  let app: INestApplication
  let dataSource: DataSource

  beforeAll(async () => {
    const testingModule: TestingModule = await Test.createTestingModule({
      imports: [AppModule]
    })
      .overrideProvider(EmailService)
      .useValue({
        sendEmail: jest.fn()
      })
      .compile()

    testingModule.useLogger(new EmptyLogger())
    app = testingModule.createNestApplication()
    await app.init()
    // We can get any dependency this way, because we have specified it in AppModule.
    dataSource = testingModule.get<DataSource>(DataSource)
  })

  afterAll(async () => {
    await app.close()
  })

  beforeEach(async () => {
    await clearDb(dataSource)
    await createUser(app)
  })

  describe(`recover-password`, () => {
    it(`should send a recovery email.`, async () => {
      const response = await request(app.getHttpServer())
        .post('/password-recovery/recover-password')
        .send({ email: userInfo.email })
        .expect(201)

      expect(response.text).toEqual(
        `A password reset link has been sent to your email.`
      )
    })

    it(`should throw when no user is found by the given email.`, async () => {
      const response = await request(app.getHttpServer())
        .post('/password-recovery/recover-password')
        .send({ email: 'non-existing@gmail.com' })
        .expect(404)

      expect(messageFrom(response)).toEqual(`There's no user by this email.`)
    })

    it(`should throw when the user was logged in using their Google account.`, async () => {
      // Login using Google
      await mockGoogleAuthUserData(app)
      await request(app.getHttpServer())
        .post('/users/google-login')
        .set('Authorization', `Bearer ${sampleToken.token}`)
        .expect(201)

      // Try to recover account
      const response = await request(app.getHttpServer())
        .post('/password-recovery/recover-password')
        .send({ email: googleUser().email })
        .expect(400)

      expect(messageFrom(response)).toEqual(
        `You had previously logged in using Google. Please login using Google.`
      )
    })

    it(`should delete the previous recovery when it exists.`, async () => {
      const emailSpy = await spyOnEmailService(app)

      // create previous recovery
      await request(app.getHttpServer())
        .post('/password-recovery/recover-password')
        .send({ email: userInfo.email })
        .expect(201)
      const previousCode = getRecoveryCodeFrom(emailSpy)

      // create new recovery
      await request(app.getHttpServer())
        .post('/password-recovery/recover-password')
        .send({ email: userInfo.email })
        .expect(201)
      const newCode = getRecoveryCodeFrom(emailSpy)

      expect(previousCode).not.toEqual(newCode)

      // validate previous code: code not found because deleted
      const response = await request(app.getHttpServer())
        .get('/password-recovery/validate-code')
        .send({ recoveryCode: previousCode })
        .expect(404)
      expect(messageFrom(response)).toEqual(`Code not found.`)

      // validate new code: success
      await request(app.getHttpServer())
        .get('/password-recovery/validate-code')
        .send({ recoveryCode: newCode })
        .expect(200)
    })

    it(`should throw when some other user already has the newly generated code.`, async () => {
      // mock the error due to duplicate recovery code.
      const passwordRecoveryRepo = await app.resolve(PasswordRecoveryRepository)
      jest
        .spyOn(passwordRecoveryRepo, 'create')
        .mockRejectedValueOnce(
          new QueryFailedError('SomeQuery', ['SomeParams'], 'SomeDriverError')
        )

      const response = await request(app.getHttpServer())
        .post('/password-recovery/recover-password')
        .send({ email: userInfo.email })
        .expect(409)

      expect(messageFrom(response)).toEqual(
        `Something went wrong. Please try again.`
      )
    })
  })

  describe(`validate-code`, () => {
    it(`should return username and the same recovery code when the code is valid.`, async () => {
      const emailSpy = await spyOnEmailService(app)

      // create a recovery
      await request(app.getHttpServer())
        .post('/password-recovery/recover-password')
        .send({ email: userInfo.email })
        .expect(201)
      const recoveryCode = getRecoveryCodeFrom(emailSpy)

      // validate the recovery
      const response = await request(app.getHttpServer())
        .get('/password-recovery/validate-code')
        .send({ recoveryCode: recoveryCode })
        .expect(200)

      expect(response.body.recoveryCode).toEqual(recoveryCode)
      expect(response.body.username).toEqual(userInfo.username)
    })

    it(`should throw when the given recovery code is not found in database.`, async () => {
      const response = await request(app.getHttpServer())
        .get('/password-recovery/validate-code')
        .send(invalidCode)
        .expect(404)
      expect(messageFrom(response)).toEqual(`Code not found.`)
    })

    it(`should throw when the given recovery code is expired.`, async () => {
      const emailSpy = await spyOnEmailService(app)

      // create a recovery code
      await request(app.getHttpServer())
        .post('/password-recovery/recover-password')
        .send({ email: userInfo.email })
        .expect(201)
      const recoveryCode = getRecoveryCodeFrom(emailSpy)

      // valid when code is used immediately
      await request(app.getHttpServer())
        .get('/password-recovery/validate-code')
        .send({ recoveryCode: recoveryCode })
        .expect(200)

      // valid when half the expiry time has elapsed
      const halfExpiryMinutes = Math.floor(expiryMinutes() / 2)
      forwardSystemTimeOnceBy(halfExpiryMinutes)
      await request(app.getHttpServer())
        .get('/password-recovery/validate-code')
        .send({ recoveryCode: recoveryCode })
        .expect(200)

      // invalid when all the expiry time has elapsed
      forwardSystemTimeOnceBy(expiryMinutes())
      const response = await request(app.getHttpServer())
        .get('/password-recovery/validate-code')
        .send({ recoveryCode: recoveryCode })
        .expect(401)

      expect(messageFrom(response)).toEqual(`The recovery code has expired.`)
    })

    it(`should delete the given recovery code when it is expired.`, async () => {
      const emailSpy = await spyOnEmailService(app)

      // create a recovery code
      await request(app.getHttpServer())
        .post('/password-recovery/recover-password')
        .send({ email: userInfo.email })
        .expect(201)
      const recoveryCode = getRecoveryCodeFrom(emailSpy)

      // make it expire
      forwardSystemTimeOnceBy(expiryMinutes())

      // try to validate: this will delete the code
      const expiredResponse = await request(app.getHttpServer())
        .get('/password-recovery/validate-code')
        .send({ recoveryCode: recoveryCode })
        .expect(401)
      expect(messageFrom(expiredResponse)).toEqual(
        `The recovery code has expired.`
      )

      // try again: code should not be found
      const deletedResponse = await request(app.getHttpServer())
        .get('/password-recovery/validate-code')
        .send({ recoveryCode: recoveryCode })
        .expect(404)
      expect(messageFrom(deletedResponse)).toEqual(`Code not found.`)
    })

    it(`should throw when length of the code is not ${RECOVERY_CODE_LENGTH}.`, async () => {
      const response = await request(app.getHttpServer())
        .get('/password-recovery/validate-code')
        .send({ recoveryCode: 'shorter-length-recovery-code' })
        .expect(400)

      expect(messageFrom(response)).toEqual(
        `Recovery code must be exactly ${RECOVERY_CODE_LENGTH} characters long.`
      )
    })

    it(`should trim the outer spaces in the recovery code provided by user.`, async () => {
      const emailSpy = await spyOnEmailService(app)

      // create a recovery
      await request(app.getHttpServer())
        .post('/password-recovery/recover-password')
        .send({ email: userInfo.email })
        .expect(201)
      const codeFromEmail = getRecoveryCodeFrom(emailSpy)
      const codeWithSpaces = '  ' + codeFromEmail + '  '

      // validate code: success means the spaces were trimmed successfully
      await request(app.getHttpServer())
        .get('/password-recovery/validate-code')
        .send({ recoveryCode: codeWithSpaces })
        .expect(200)
    })
  })

  describe(`reset-password`, () => {
    it(`should set the new password when the recovery code is valid.`, async () => {
      const emailSpy = await spyOnEmailService(app)

      // create a recovery
      await request(app.getHttpServer())
        .post('/password-recovery/recover-password')
        .send({ email: userInfo.email })
        .expect(201)
      const codeFromEmail = getRecoveryCodeFrom(emailSpy)

      // validate code and get username
      const validatedResponse = await request(app.getHttpServer())
        .get('/password-recovery/validate-code')
        .send({ recoveryCode: codeFromEmail })
        .expect(200)
      const { username, recoveryCode } = validatedResponse.body

      // reset password
      await request(app.getHttpServer())
        .post('/password-recovery/reset-password')
        .send(validPasswordsWith(recoveryCode))
        .expect(201)

      // login with new password
      await request(app.getHttpServer())
        .post('/users/login')
        .send({ username: username, password: validPasswords.newPassword })
        .expect(201)
    })

    it(`should throw when the given recovery code is not found in database.`, async () => {
      // reset password
      const response = await request(app.getHttpServer())
        .post('/password-recovery/reset-password')
        .send(validPasswordsWith(invalidCode.recoveryCode))
        .expect(404)
      expect(messageFrom(response)).toEqual(`Code not found.`)
    })

    it(`should throw when the given recovery code is expired.`, async () => {
      const emailSpy = await spyOnEmailService(app)

      // create a recovery code
      await request(app.getHttpServer())
        .post('/password-recovery/recover-password')
        .send({ email: userInfo.email })
        .expect(201)
      const codeFromEmail = getRecoveryCodeFrom(emailSpy)

      // make the code expire
      forwardSystemTimeOnceBy(expiryMinutes())

      // reset password
      const response = await request(app.getHttpServer())
        .post('/password-recovery/reset-password')
        .send(validPasswordsWith(codeFromEmail))
        .expect(401)
      expect(messageFrom(response)).toEqual(`The recovery code has expired.`)
    })

    it(`should delete the given recovery code when it is expired.`, async () => {
      const emailSpy = await spyOnEmailService(app)

      // create a recovery code
      await request(app.getHttpServer())
        .post('/password-recovery/recover-password')
        .send({ email: userInfo.email })
        .expect(201)
      const codeFromEmail = getRecoveryCodeFrom(emailSpy)

      // make the code expire
      forwardSystemTimeOnceBy(expiryMinutes())

      // try to reset password: this will delete the code
      const expiredResponse = await request(app.getHttpServer())
        .post('/password-recovery/reset-password')
        .send(validPasswordsWith(codeFromEmail))
        .expect(401)
      expect(messageFrom(expiredResponse)).toEqual(
        `The recovery code has expired.`
      )

      // try to reset password again: code should not be found
      const deletedResponse = await request(app.getHttpServer())
        .post('/password-recovery/reset-password')
        .send(validPasswordsWith(codeFromEmail))
        .expect(404)
      expect(messageFrom(deletedResponse)).toEqual(`Code not found.`)
    })

    it(`should throw when the new password and confirm-password do not match.`, async () => {
      const emailSpy = await spyOnEmailService(app)

      // create a recovery code
      await request(app.getHttpServer())
        .post('/password-recovery/recover-password')
        .send({ email: userInfo.email })
        .expect(201)
      const codeFromEmail = getRecoveryCodeFrom(emailSpy)

      // reset password
      const response = await request(app.getHttpServer())
        .post('/password-recovery/reset-password')
        .send(mismatchedPasswordsWith(codeFromEmail))
        .expect(400)
      expect(messageFrom(response)).toEqual(`Confirm Password must match.`)
    })

    it(`should throw when the new password is same as the current password.`, async () => {
      const emailSpy = await spyOnEmailService(app)

      // create a recovery code
      await request(app.getHttpServer())
        .post('/password-recovery/recover-password')
        .send({ email: userInfo.email })
        .expect(201)
      const codeFromEmail = getRecoveryCodeFrom(emailSpy)

      // reset password
      const response = await request(app.getHttpServer())
        .post('/password-recovery/reset-password')
        .send(oldPasswordsWith(codeFromEmail))
        .expect(400)
      expect(messageFrom(response)).toEqual(
        `Do not use your old password as the new password.`
      )
    })

    it(`should delete the recovery code when the password reset is successful.`, async () => {
      const emailSpy = await spyOnEmailService(app)

      // create a recovery
      await request(app.getHttpServer())
        .post('/password-recovery/recover-password')
        .send({ email: userInfo.email })
        .expect(201)
      const codeFromEmail = getRecoveryCodeFrom(emailSpy)

      // validate code and get username
      const validatedResponse = await request(app.getHttpServer())
        .get('/password-recovery/validate-code')
        .send({ recoveryCode: codeFromEmail })
        .expect(200)
      const recoveryCode = validatedResponse.body.recoveryCode

      // reset password
      await request(app.getHttpServer())
        .post('/password-recovery/reset-password')
        .send(validPasswordsWith(recoveryCode))
        .expect(201)

      // reset password again with the same code: it should not be found
      const notFoundResponse = await request(app.getHttpServer())
        .post('/password-recovery/reset-password')
        .send(validPasswordsWith(codeFromEmail))
        .expect(404)
      expect(messageFrom(notFoundResponse)).toEqual(`Code not found.`)
    })

    it(`should throw when length of the code is not ${RECOVERY_CODE_LENGTH}.`, async () => {
      const response = await request(app.getHttpServer())
        .post('/password-recovery/reset-password')
        .send(validPasswordsWith(shortRecoveryCode))
        .expect(400)

      expect(messageFrom(response)).toEqual(
        `Recovery code must be exactly ${RECOVERY_CODE_LENGTH} characters long.`
      )
    })

    it(`should trim the outer spaces in the recovery code provided by user.`, async () => {
      const emailSpy = await spyOnEmailService(app)

      // create a recovery
      await request(app.getHttpServer())
        .post('/password-recovery/recover-password')
        .send({ email: userInfo.email })
        .expect(201)
      const codeFromEmail = getRecoveryCodeFrom(emailSpy)
      const spaces = '  '
      const codeWithSpaces = spaces + codeFromEmail + spaces

      // reset password: success means the spaces were trimmed successfully
      await request(app.getHttpServer())
        .post('/password-recovery/reset-password')
        .send(validPasswordsWith(codeWithSpaces))
        .expect(201)
    })

    it(`should throw when length of the new password is less than ${MIN_LENGTH_PASSWORD}.`, async () => {
      const emailSpy = await spyOnEmailService(app)

      // create a recovery
      await request(app.getHttpServer())
        .post('/password-recovery/recover-password')
        .send({ email: userInfo.email })
        .expect(201)
      const codeFromEmail = getRecoveryCodeFrom(emailSpy)

      const response = await request(app.getHttpServer())
        .post('/password-recovery/reset-password')
        .send(shortPasswordsWith(codeFromEmail))
        .expect(400)

      expect(messageFrom(response)).toEqual(
        `New Password must be at least ${MIN_LENGTH_PASSWORD} characters long.`
      )
    })

    it(`should throw when the new password doesn't contain a special character.`, async () => {
      const emailSpy = await spyOnEmailService(app)

      // create a recovery
      await request(app.getHttpServer())
        .post('/password-recovery/recover-password')
        .send({ email: userInfo.email })
        .expect(201)
      const codeFromEmail = getRecoveryCodeFrom(emailSpy)

      const response = await request(app.getHttpServer())
        .post('/password-recovery/reset-password')
        .send(noSpecialCharPasswordsWith(codeFromEmail))
        .expect(400)

      expect(messageFrom(response)).toEqual(
        `New Password must contain at least 1 digit and 1 special character.`
      )
    })

    it(`should throw when the new password doesn't contain a digit.`, async () => {
      const emailSpy = await spyOnEmailService(app)

      // create a recovery
      await request(app.getHttpServer())
        .post('/password-recovery/recover-password')
        .send({ email: userInfo.email })
        .expect(201)
      const codeFromEmail = getRecoveryCodeFrom(emailSpy)

      const response = await request(app.getHttpServer())
        .post('/password-recovery/reset-password')
        .send(noSpecialCharPasswordsWith(codeFromEmail))
        .expect(400)

      expect(messageFrom(response)).toEqual(
        `New Password must contain at least 1 digit and 1 special character.`
      )
    })
  })
})

async function createUser(app: INestApplication) {
  await request(app.getHttpServer()).post('/users/sign-up').send(userInfo)
}
