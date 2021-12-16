import { INestApplication } from '@nestjs/common'
import { Test, TestingModule } from '@nestjs/testing'
import * as request from 'supertest'
import {
  MIN_LENGTH_PASSWORD,
  MIN_LENGTH_USERNAME
} from '../../src/users/dtos/signup-user.dto'
import { AppModule } from '../../src/app.module'
import {
  signUpWithAlreadyExistingName,
  signUpWithConfirmPasswordNoMatch,
  signUpWithCorrectInfo,
  signUpWithInvalidEmail,
  signUpWithPasswordSevenChars,
  signUpWithPasswordWithoutDigit,
  signUpWithPasswordWithoutSpecialChars,
  signUpWithUsernameTwoChars
} from './fixtures/sign-up.fixtures'
import { clearDb, expectMessageFrom, tokenFrom } from '../utils/test.utils'
import { isUUID } from 'class-validator'

describe(`UsersModule`, () => {
  let app: INestApplication

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule]
    }).compile()

    app = moduleFixture.createNestApplication()
    await app.init()

    await clearDb()
  })

  afterAll(async () => {
    await app.close()
  })

  describe(`sign-up`, () => {
    it(`should return a token when correct user info provided.`, async () => {
      const response = await request(app.getHttpServer())
        .post('/users/sign-up')
        .send(signUpWithCorrectInfo)
        .expect(201)
      expect(response.body).toHaveProperty('token')
      const decodedToken = tokenFrom(response)
      expect(decodedToken.username).toEqual(signUpWithCorrectInfo.username)
      expect(decodedToken).toHaveProperty('userId')
    })

    it(`should throw when username less than ${MIN_LENGTH_USERNAME} characters.`, async () => {
      const response: request.Response = await request(app.getHttpServer())
        .post('/users/sign-up')
        .send(signUpWithUsernameTwoChars)
        .expect(400)
      expectMessageFrom(response).toEqual(
        `Username must be at least ${MIN_LENGTH_USERNAME} characters long.`
      )
    })

    it(`should throw when email is invalid.`, async () => {
      const response: request.Response = await request(app.getHttpServer())
        .post('/users/sign-up')
        .send(signUpWithInvalidEmail)
        .expect(400)
      expectMessageFrom(response).toEqual('Please enter a valid email address.')
    })

    it(`should throw when password less than ${MIN_LENGTH_PASSWORD} characters.`, async () => {
      const response: request.Response = await request(app.getHttpServer())
        .post('/users/sign-up')
        .send(signUpWithPasswordSevenChars)
        .expect(400)
      expectMessageFrom(response).toEqual(
        `Password must be at least ${MIN_LENGTH_PASSWORD} characters long.`
      )
    })

    it(`should throw when password is without any special character.`, async () => {
      const response = await request(app.getHttpServer())
        .post('/users/sign-up')
        .send(signUpWithPasswordWithoutSpecialChars)
        .expect(400)
      expectMessageFrom(response).toEqual(
        'Password must contain at least 1 digit and 1 special character.'
      )
    })

    it(`should throw when password is without any digit.`, async () => {
      const response = await request(app.getHttpServer())
        .post('/users/sign-up')
        .send(signUpWithPasswordWithoutDigit)
        .expect(400)
      expectMessageFrom(response).toEqual(
        'Password must contain at least 1 digit and 1 special character.'
      )
    })

    it(`should throw when confirm password doesn't match with password.`, async () => {
      const response = await request(app.getHttpServer())
        .post('/users/sign-up')
        .send(signUpWithConfirmPasswordNoMatch)
        .expect(400)
      expectMessageFrom(response).toEqual(
        'Confirm Password must match with Password.'
      )
    })

    it(`should throw when username already exists.`, async () => {
      await clearDb()
      await request(app.getHttpServer())
        .post('/users/sign-up')
        .send(signUpWithCorrectInfo)
        .expect(201)
      const response = await request(app.getHttpServer())
        .post('/users/sign-up')
        .send(signUpWithAlreadyExistingName)
        .expect(400)
      expectMessageFrom(response).toEqual('Username already exists.')
    })

    it(`should throw when email already exists.`, async () => {
      await clearDb()
      await request(app.getHttpServer())
        .post('/users/sign-up')
        .send(signUpWithCorrectInfo)
        .expect(201)
      const response = await request(app.getHttpServer())
        .post('/users/sign-up')
        .send(signUpWithCorrectInfo)
        .expect(400)
      expectMessageFrom(response).toEqual('Username already exists.')
    })
  })
})
