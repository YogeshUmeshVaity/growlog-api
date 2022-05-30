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
import {
  correctPasswords,
  sameNewPassword,
  wrongConfirmPassword,
  wrongCurrentPassword
} from './fixtures/update-password.fixtures'

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
      expect(messageFrom(response)).toEqual(`Confirm Password must match.`)
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

  describe(`login`, () => {
    it(`should return a valid token.`, async () => {
      // create new user
      const signUpResponse = await request(app.getHttpServer())
        .post('/users/sign-up')
        .send(userWithCorrectInfo)
        .expect(201)
      const existingToken = signUpResponse.body.token

      // ensure new user is authenticated(findMe)
      await request(app.getHttpServer())
        .get('/users/me')
        .set('Authorization', `Bearer ${existingToken}`)
        .expect(200)

      // logout other devices
      await request(app.getHttpServer())
        .post('/users/logout-other-devices')
        .set('Authorization', `Bearer ${existingToken}`)
        .expect(201)

      // login user
      const loginResponse = await request(app.getHttpServer())
        .post('/users/login')
        .send({
          username: userWithCorrectInfo.username,
          password: userWithCorrectInfo.password
        })
        .expect(201)

      // ensure user is authenticated
      await request(app.getHttpServer())
        .get('/users/me')
        .set('Authorization', `Bearer ${loginResponse.body.token}`)
        .expect(200)
    })

    it(`should throw when user is not found.`, async () => {
      // login without creating the user
      const response = await request(app.getHttpServer())
        .post('/users/login')
        .send({
          username: userWithCorrectInfo.username,
          password: userWithCorrectInfo.password
        })
        .expect(401)

      expect(messageFrom(response)).toEqual(
        `User ${userWithCorrectInfo.username} doesn't exist.`
      )
    })

    it(`should throw when password doesn't match.`, async () => {
      // create new user
      await request(app.getHttpServer())
        .post('/users/sign-up')
        .send(userWithCorrectInfo)
        .expect(201)

      // login with incorrect password
      const loginResponse = await request(app.getHttpServer())
        .post('/users/login')
        .send({
          username: userWithCorrectInfo.username,
          password: 'incorrectPassword4$'
        })
        .expect(401)

      expect(messageFrom(loginResponse)).toEqual(`Incorrect password.`)
    })
  })

  describe(`logout-other-devices`, () => {
    it(`should invalidate the existing tokens from all devices.`, async () => {
      // create new user
      const signUpResponse = await request(app.getHttpServer())
        .post('/users/sign-up')
        .send(userWithCorrectInfo)
        .expect(201)
      const existingToken = signUpResponse.body.token

      // ensure new user is authenticated(findMe)
      await request(app.getHttpServer())
        .get('/users/me')
        .set('Authorization', `Bearer ${existingToken}`)
        .expect(200)

      // logout other devices
      await request(app.getHttpServer())
        .post('/users/logout-other-devices')
        .set('Authorization', `Bearer ${existingToken}`)
        .expect(201)

      // ensure user is not authenticated(findMe)
      await request(app.getHttpServer())
        .get('/users/me')
        .set('Authorization', `Bearer ${existingToken}`)
        .expect(401)

      // TODO: login user on current device

      // TODO: ensure user is authenticated
    })
  })

  describe(`update-username`, () => {
    it(`should update the username when the name doesn't already exist.`, async () => {
      // create user
      const signUpResponse = await request(app.getHttpServer())
        .post('/users/sign-up')
        .send(userWithCorrectInfo)
        .expect(201)

      // change username
      const newUsername = 'someNewUsername'
      await request(app.getHttpServer())
        .put('/users/update-username')
        .set('Authorization', `Bearer ${signUpResponse.body.token}`)
        .send({ username: newUsername })
        .expect(200)

      // ensure username has changed
      const findMeResponse = await request(app.getHttpServer())
        .get('/users/me')
        .set('Authorization', `Bearer ${signUpResponse.body.token}`)
      expect(findMeResponse.body.username).toEqual(newUsername)
    })

    it(`should throw error when username already exists.`, async () => {
      // create user
      const signUpResponse = await request(app.getHttpServer())
        .post('/users/sign-up')
        .send(userWithCorrectInfo)
        .expect(201)

      // change username with the same name
      const newUsername = userWithCorrectInfo.username
      const response = await request(app.getHttpServer())
        .put('/users/update-username')
        .set('Authorization', `Bearer ${signUpResponse.body.token}`)
        .send({ username: newUsername })
        .expect(400)
      expect(messageFrom(response)).toEqual(`Username already exists.`)
    })
  })

  describe(`update-email`, () => {
    it(`should update the email when the email doesn't already exist.`, async () => {
      // create user
      const signUpResponse = await request(app.getHttpServer())
        .post('/users/sign-up')
        .send(userWithCorrectInfo)
        .expect(201)

      // change email
      const newEmail = 'newEmail@gmail.com'
      await request(app.getHttpServer())
        .put('/users/update-email')
        .set('Authorization', `Bearer ${signUpResponse.body.token}`)
        .send({ email: newEmail })
        .expect(200)

      // ensure email has changed
      const findMeResponse = await request(app.getHttpServer())
        .get('/users/me')
        .set('Authorization', `Bearer ${signUpResponse.body.token}`)
      expect(findMeResponse.body.email).toEqual(newEmail)
    })

    it(`should throw error when email already exists.`, async () => {
      // create user
      const signUpResponse = await request(app.getHttpServer())
        .post('/users/sign-up')
        .send(userWithCorrectInfo)
        .expect(201)

      // change email with the same email address
      const newEmail = userWithCorrectInfo.email
      const response = await request(app.getHttpServer())
        .put('/users/update-email')
        .set('Authorization', `Bearer ${signUpResponse.body.token}`)
        .send({ email: newEmail })
        .expect(400)
      expect(messageFrom(response)).toEqual(`Email already exists.`)
    })
  })

  describe(`update-password`, () => {
    it(`should update the password.`, async () => {
      // create user
      const user = userWithCorrectInfo
      const signUpResponse = await request(app.getHttpServer())
        .post('/users/sign-up')
        .send(user)
        .expect(201)

      // change password
      await request(app.getHttpServer())
        .put('/users/update-password')
        .set('Authorization', `Bearer ${signUpResponse.body.token}`)
        .send(correctPasswords)
        .expect(200)

      // ensure password has changed
      const loginResponse = await request(app.getHttpServer())
        .post('/users/login')
        .send({
          username: user.username,
          password: correctPasswords.newPassword
        })
        .expect(201)

      // ensure password has been changed for the correct user
      const { username } = decodeTokenFrom(loginResponse)
      expect(username).toEqual(user.username)
    })

    it(`should throw error when user is logged-in using third party.`, async () => {
      // login with google
      await mockGoogleAuthUserData(app)
      const signUpResponse = await request(app.getHttpServer())
        .post('/users/google-login')
        .set('Authorization', `Bearer ${sampleToken.token}`)
        .expect(201)

      // try to change password
      const passwordResponse = await request(app.getHttpServer())
        .put('/users/update-password')
        .set('Authorization', `Bearer ${signUpResponse.body.token}`)
        .send(correctPasswords)
        .expect(400)
      expect(messageFrom(passwordResponse)).toEqual(
        'You have logged in using a third party. ' +
          +'Password can be changed from the third party website only.'
      )
    })

    it(`should throw error when confirm-password doesn't match the new-password.`, async () => {
      // create user
      const user = userWithCorrectInfo
      const signUpResponse = await request(app.getHttpServer())
        .post('/users/sign-up')
        .send(user)
        .expect(201)

      // try with wrong confirm-password
      const passwordResponse = await request(app.getHttpServer())
        .put('/users/update-password')
        .set('Authorization', `Bearer ${signUpResponse.body.token}`)
        .send(wrongConfirmPassword)
        .expect(400)
      expect(messageFrom(passwordResponse)).toEqual(
        `Confirm Password must match.`
      )
    })

    it(`should throw error when current-password is incorrect.`, async () => {
      // create user
      const user = userWithCorrectInfo
      const signUpResponse = await request(app.getHttpServer())
        .post('/users/sign-up')
        .send(user)
        .expect(201)

      // try with wrong current-password
      const passwordResponse = await request(app.getHttpServer())
        .put('/users/update-password')
        .set('Authorization', `Bearer ${signUpResponse.body.token}`)
        .send(wrongCurrentPassword)
        .expect(401)
      expect(messageFrom(passwordResponse)).toEqual(`Incorrect password.`)
    })

    it(`should throw error when new-password is same as existing password.`, async () => {
      // create user
      const user = userWithCorrectInfo
      const signUpResponse = await request(app.getHttpServer())
        .post('/users/sign-up')
        .send(user)
        .expect(201)

      // try with wrong current-password
      const passwordResponse = await request(app.getHttpServer())
        .put('/users/update-password')
        .set('Authorization', `Bearer ${signUpResponse.body.token}`)
        .send(sameNewPassword)
        .expect(400)
      expect(messageFrom(passwordResponse)).toEqual(
        `New password and existing password cannot be the same.`
      )
    })
  })
})
