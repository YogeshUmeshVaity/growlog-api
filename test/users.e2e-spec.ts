import { INestApplication } from '@nestjs/common'
import { Test, TestingModule } from '@nestjs/testing'
import * as request from 'supertest'
import {
  MIN_LENGTH_PASSWORD,
  MIN_LENGTH_USERNAME
} from '../src/users/dtos/signup-user.dto'
import { AppModule } from './../src/app.module'
import {
  userWithAlreadyExistingName,
  userWithConfirmPasswordNoMatch,
  userWithCorrectInfo,
  userWithInvalidEmail,
  userWithPasswordSevenChars,
  userWithPasswordWithoutDigit,
  userWithPasswordWithoutSpecialChars,
  userWithUsernameTwoChars
} from './fixtures/users.fixtures'
import { clearDb, expectMessageFrom } from './test.utils'

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

  describe(`sign-up route`, () => {
    it(`should return a token when correct user info provided.`, async () => {
      const response = await request(app.getHttpServer())
        .post('/users/sign-up')
        .send(userWithCorrectInfo)
        .expect(201)
    })

    it(`should throw when username less than ${MIN_LENGTH_USERNAME} characters.`, async () => {
      const response: request.Response = await request(app.getHttpServer())
        .post('/users/sign-up')
        .send(userWithUsernameTwoChars)
        .expect(400)
      expectMessageFrom(response).toBe(
        `Username must be at least ${MIN_LENGTH_USERNAME} characters long.`
      )
    })

    it(`should throw when email is invalid.`, async () => {
      const response: request.Response = await request(app.getHttpServer())
        .post('/users/sign-up')
        .send(userWithInvalidEmail)
        .expect(400)
      expectMessageFrom(response).toBe('Please enter a valid email address.')
    })

    it(`should throw when password less than ${MIN_LENGTH_PASSWORD} characters.`, async () => {
      const response: request.Response = await request(app.getHttpServer())
        .post('/users/sign-up')
        .send(userWithPasswordSevenChars)
        .expect(400)
      expectMessageFrom(response).toBe(
        `Password must be at least ${MIN_LENGTH_PASSWORD} characters long.`
      )
    })

    it(`should throw when password is without any special character.`, async () => {
      const response = await request(app.getHttpServer())
        .post('/users/sign-up')
        .send(userWithPasswordWithoutSpecialChars)
        .expect(400)
      expectMessageFrom(response).toBe(
        'Password must contain at least 1 digit and 1 special character.'
      )
    })

    it(`should throw when password is without any digit.`, async () => {
      const response = await request(app.getHttpServer())
        .post('/users/sign-up')
        .send(userWithPasswordWithoutDigit)
        .expect(400)
      expectMessageFrom(response).toBe(
        'Password must contain at least 1 digit and 1 special character.'
      )
    })

    it(`should throw when confirm password doesn't match with password.`, async () => {
      const response = await request(app.getHttpServer())
        .post('/users/sign-up')
        .send(userWithConfirmPasswordNoMatch)
        .expect(400)
      expectMessageFrom(response).toBe(
        'Confirm Password must match with Password.'
      )
    })

    it(`should throw when username already exists.`, async () => {
      await clearDb()
      await request(app.getHttpServer())
        .post('/users/sign-up')
        .send(userWithCorrectInfo)
        .expect(201)
      const response = await request(app.getHttpServer())
        .post('/users/sign-up')
        .send(userWithAlreadyExistingName)
        .expect(400)
      expectMessageFrom(response).toBe('Username already exists.')
    })

    it(`should throw when email already exists.`, async () => {
      await clearDb()
      await request(app.getHttpServer())
        .post('/users/sign-up')
        .send(userWithCorrectInfo)
        .expect(201)
      const response = await request(app.getHttpServer())
        .post('/users/sign-up')
        .send(userWithCorrectInfo)
        .expect(400)
      expectMessageFrom(response).toBe('Username already exists.')
    })
  })
})
