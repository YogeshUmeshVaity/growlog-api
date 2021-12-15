import { INestApplication } from '@nestjs/common'
import { Test, TestingModule } from '@nestjs/testing'
import * as request from 'supertest'
import { AppModule } from './../src/app.module'
import {
  userWithAlreadyExistingName,
  userWithConfirmPasswordNoMatch,
  userWithCorrectInfo,
  userWithPasswordSevenChars,
  userWithPasswordWithoutDigit,
  userWithPasswordWithoutSpecialChars
} from './fixtures/users.fixtures'
import { clearDb } from './test.utils'

describe(`App (e2e)`, () => {
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

  describe(`UsersModule`, () => {
    describe(`sign-up route`, () => {
      it(`should return a token when correct user info provided.`, async () => {
        const response = await request(app.getHttpServer())
          .post('/users/sign-up')
          .send(userWithCorrectInfo)
          .expect(201)
      })

      it(`should throw when password less than 8 characters.`, async () => {
        const response = await request(app.getHttpServer())
          .post('/users/sign-up')
          .send(userWithPasswordSevenChars)
          .expect(400)
      })

      it(`should throw when password is without any special character.`, async () => {
        const response = await request(app.getHttpServer())
          .post('/users/sign-up')
          .send(userWithPasswordWithoutSpecialChars)
          .expect(400)
      })

      it(`should throw when password is without any digit.`, async () => {
        const response = await request(app.getHttpServer())
          .post('/users/sign-up')
          .send(userWithPasswordWithoutDigit)
          .expect(400)
      })

      it(`should throw when confirm password doesn't match with password.`, async () => {
        const response = await request(app.getHttpServer())
          .post('/users/sign-up')
          .send(userWithConfirmPasswordNoMatch)
          .expect(400)
      })

      it(`should throw when username already exists.`, async () => {
        await clearDb()
        await request(app.getHttpServer())
          .post('/users/sign-up')
          .send(userWithCorrectInfo)
          .expect(201)
        await request(app.getHttpServer())
          .post('/users/sign-up')
          .send(userWithAlreadyExistingName)
          .expect(400)
      })

      it(`should throw when email already exists.`, async () => {
        await clearDb()
        await request(app.getHttpServer())
          .post('/users/sign-up')
          .send(userWithCorrectInfo)
          .expect(201)
        await request(app.getHttpServer())
          .post('/users/sign-up')
          .send(userWithCorrectInfo)
          .expect(400)
      })
    })
  })
})
