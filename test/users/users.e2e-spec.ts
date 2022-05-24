import { INestApplication } from '@nestjs/common'
import { Test, TestingModule } from '@nestjs/testing'
import * as request from 'supertest'
import { validate as isUuid } from 'uuid'
import { AppModule } from '../../src/app.module'
import {
  MAX_LENGTH_USERNAME,
  MIN_LENGTH_PASSWORD,
  MIN_LENGTH_USERNAME
} from '../../src/users/dtos/signup-user.dto'
import {
  mockGoogleAuthError,
  mockGoogleAuthUserData
} from '../common-mocks/google-auth-service.mock'
import { clearDb, decodeTokenFrom, messageFrom } from '../utils/test.utils'
import { sampleUser } from './fixtures/find-me.fixtures'
import {
  sampleToken,
  userWithAlreadyExistingName,
  userWithConfirmPasswordEmpty,
  userWithConfirmPasswordNoMatch,
  userWithCorrectInfo,
  userWithInvalidEmail,
  userWithPasswordSevenChars,
  userWithPasswordWithoutDigit,
  userWithPasswordWithoutSpecialChars,
  userWithUsernameSpecialChars,
  userWithUsernameTwentyTwoChars,
  userWithUsernameTwoChars
} from './fixtures/sign-up.fixtures'

describe(`UsersModule`, () => {
  let app: INestApplication

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule]
    }).compile()

    app = moduleFixture.createNestApplication()
    await app.init()
  })

  afterAll(async () => {
    await app.close()
  })

  beforeEach(async () => {
    await clearDb()
  })

  describe(`sign-up`, () => {
    it(`should return a token when correct user info provided.`, async () => {
      const response = await request(app.getHttpServer())
        .post('/users/sign-up')
        .send(userWithCorrectInfo)
        .expect(201)
      expect(response.body).toHaveProperty('token')
      const { username, userId } = decodeTokenFrom(response)
      expect(username).toEqual(userWithCorrectInfo.username)
      expect(isUuid(userId)).toBe(true)
    })

    it(`should throw when username less than ${MIN_LENGTH_USERNAME} characters.`, async () => {
      const response: request.Response = await request(app.getHttpServer())
        .post('/users/sign-up')
        .send(userWithUsernameTwoChars)
        .expect(400)
      expect(messageFrom(response)).toEqual(
        `Username must be at least ${MIN_LENGTH_USERNAME} characters long.`
      )
    })

    it(`should throw when username more than ${MAX_LENGTH_USERNAME} characters.`, async () => {
      const response: request.Response = await request(app.getHttpServer())
        .post('/users/sign-up')
        .send(userWithUsernameTwentyTwoChars)
        .expect(400)
      expect(messageFrom(response)).toEqual(
        `Username can be maximum ${MAX_LENGTH_USERNAME} characters long.`
      )
    })

    it(`should throw when username contains special characters.`, async () => {
      const response: request.Response = await request(app.getHttpServer())
        .post('/users/sign-up')
        .send(userWithUsernameSpecialChars)
        .expect(400)
      expect(messageFrom(response)).toEqual(
        `Username can contain only letters and numbers.`
      )
    })

    it(`should throw when email is invalid.`, async () => {
      const response: request.Response = await request(app.getHttpServer())
        .post('/users/sign-up')
        .send(userWithInvalidEmail)
        .expect(400)
      expect(messageFrom(response)).toEqual(
        `Please enter a valid email address.`
      )
    })

    it(`should throw when password less than ${MIN_LENGTH_PASSWORD} characters.`, async () => {
      const response: request.Response = await request(app.getHttpServer())
        .post('/users/sign-up')
        .send(userWithPasswordSevenChars)
        .expect(400)
      expect(messageFrom(response)).toEqual(
        `Password must be at least ${MIN_LENGTH_PASSWORD} characters long.`
      )
    })

    it(`should throw when password is without any special character.`, async () => {
      const response = await request(app.getHttpServer())
        .post('/users/sign-up')
        .send(userWithPasswordWithoutSpecialChars)
        .expect(400)
      expect(messageFrom(response)).toEqual(
        `Password must contain at least 1 digit and 1 special character.`
      )
    })

    it(`should throw when password is without any digit.`, async () => {
      const response = await request(app.getHttpServer())
        .post('/users/sign-up')
        .send(userWithPasswordWithoutDigit)
        .expect(400)
      expect(messageFrom(response)).toEqual(
        `Password must contain at least 1 digit and 1 special character.`
      )
    })

    it(`should throw when confirm-password is empty.`, async () => {
      const response = await request(app.getHttpServer())
        .post('/users/sign-up')
        .send(userWithConfirmPasswordEmpty)
        .expect(400)
      expect(messageFrom(response)).toEqual(
        `Confirm Password must not be empty.`
      )
    })

    it(`should throw when confirm-password doesn't match with password.`, async () => {
      const response = await request(app.getHttpServer())
        .post('/users/sign-up')
        .send(userWithConfirmPasswordNoMatch)
        .expect(400)
      expect(messageFrom(response)).toEqual(
        `Confirm Password must match with Password.`
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
      expect(messageFrom(response)).toEqual(`Username already exists.`)
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
      expect(messageFrom(response)).toEqual(`Username already exists.`)
    })

    //TODO: e2e test to check if spaces in username and email are trimmed.
  })

  describe(`loginWithGoogle`, () => {
    it(`should return a token when correct google access token is provided.`, async () => {
      await mockGoogleAuthUserData(app)
      const response = await request(app.getHttpServer())
        .post('/users/google-login')
        .set('Authorization', `Bearer ${sampleToken.token}`)
        .expect(201)
      expect(response.body).toHaveProperty('token')
      const { username, userId } = decodeTokenFrom(response)
      expect(username).toEqual(sampleUser().username)
      expect(isUuid(userId)).toBe(true)
    })

    it(`should return an error when incorrect google access token is provided.`, async () => {
      await mockGoogleAuthError(app)
      const response = await request(app.getHttpServer())
        .post('/users/google-login')
        .set('Authorization', `Bearer ${sampleToken.token}`)
        .expect(400)
      expect(messageFrom(response)).toEqual(
        `Invalid Google OAuth2 access token or scopes.`
      )
    })
  })

  describe(`findMe`, () => {
    it(`should return a user when correct token provided.`, async () => {
      const signUpResponse = await request(app.getHttpServer())
        .post('/users/sign-up')
        .send(userWithCorrectInfo)
        .expect(201)

      const findMeResponse = await request(app.getHttpServer())
        .get('/users/me')
        .set('Authorization', `Bearer ${signUpResponse.body.token}`)
        .expect(200)
      expect(findMeResponse.body.username).toEqual(userWithCorrectInfo.username)
      expect(findMeResponse.body).not.toHaveProperty('hashedPassword')
    })
  })

  describe(`logout-other-devices`, () => {
    it(`should invalidate the existing tokens from all devices.`, async () => {
      // create new user
      const signUpResponse = await request(app.getHttpServer())
        .post('/users/sign-up')
        .send(userWithCorrectInfo)
        .expect(201)

      // ensure new user is authenticated(findMe)
      await request(app.getHttpServer())
        .get('/users/me')
        .set('Authorization', `Bearer ${signUpResponse.body.token}`)
        .expect(200)
      // expect(findMeResponse.status).toEqual(200)

      // logout other devices
      await request(app.getHttpServer())
        .post('/users/logout-other-devices')
        .set('Authorization', `Bearer ${signUpResponse.body.token}`)
        .expect(201)

      // ensure user is not authenticated(findMe)
      await request(app.getHttpServer())
        .get('/users/me')
        .set('Authorization', `Bearer ${signUpResponse.body.token}`)
        .expect(401)

      // TODO: login with returned token

      // TODO: ensure user is authenticated
    })
  })
})
