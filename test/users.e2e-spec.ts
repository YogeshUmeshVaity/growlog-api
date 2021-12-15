import { INestApplication } from '@nestjs/common'
import { Test, TestingModule } from '@nestjs/testing'
import * as request from 'supertest'
import { AppModule } from './../src/app.module'
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
        const user = {
          username: 'test1',
          email: 'test1@test.com',
          password: 'test123&',
          confirmPassword: 'test123&'
        }
        const response = await request(app.getHttpServer())
          .post('/users/sign-up')
          .send(user)
          .expect(201)
      })

      it(`should throw when password less than 8 chars.`, async () => {
        const user = {
          username: 'test2',
          email: 'test2@test.com',
          password: 't123&',
          confirmPassword: 't123&'
        }
        const response = await request(app.getHttpServer())
          .post('/users/sign-up')
          .send(user)
          .expect(400)
      })
    })
  })
})
