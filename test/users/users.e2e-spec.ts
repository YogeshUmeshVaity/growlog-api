import { INestApplication } from '@nestjs/common'
import { Test, TestingModule } from '@nestjs/testing'
import * as request from 'supertest'
import { DataSource } from 'typeorm'
import { AppModule } from '../../src/app.module'
import { clearDb, messageFrom } from '../utils/test.utils'
import { userWithCorrectInfo } from '../auth/fixtures/sign-up.fixtures'

describe(`UsersModule`, () => {
  let app: INestApplication
  let dataSource: DataSource

  beforeAll(async () => {
    const testingModule: TestingModule = await Test.createTestingModule({
      imports: [AppModule]
    }).compile()

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
  })

  describe(`findMe`, () => {
    it(`should return a user when correct token provided.`, async () => {
      const signUpResponse = await request(app.getHttpServer())
        .post('/auth/sign-up')
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

  describe(`update-username`, () => {
    it(`should update the username when the name doesn't already exist.`, async () => {
      // create user
      const signUpResponse = await request(app.getHttpServer())
        .post('/auth/sign-up')
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
        .post('/auth/sign-up')
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
        .post('/auth/sign-up')
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
        .post('/auth/sign-up')
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
})
