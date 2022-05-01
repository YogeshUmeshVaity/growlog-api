import { createMock } from '@golevelup/ts-jest'
import { CallHandler, ExecutionContext } from '@nestjs/common'
import { lastValueFrom, of } from 'rxjs'
import { UserDto } from '../../users/dtos/user.dto'
import { SerializerInterceptor } from './serializer.interceptor'

const testUser = {
  id: '123',
  email: 'someone@abc.com',
  username: 'someUser',
  hashedPassword: 'somePass',
  googleId: 'someId',
  facebookId: 'someId',
  appleId: 'someId',
  tokenInvalidator: 'someInvalidator'
}

describe('SerializerInterceptor', () => {
  let interceptor: SerializerInterceptor

  beforeEach(() => {
    interceptor = new SerializerInterceptor(UserDto)
  })

  it('should return user object without the sensitive properties', async () => {
    const context = createMock<ExecutionContext>()
    const handler = createMock<CallHandler>({
      handle: () => of(testUser)
    })

    // test if all properties are present before intercepting
    expect(testUser).toHaveProperty('id')
    expect(testUser).toHaveProperty('email')
    expect(testUser).toHaveProperty('username')
    expect(testUser).toHaveProperty('hashedPassword')
    expect(testUser).toHaveProperty('googleId')
    expect(testUser).toHaveProperty('facebookId')
    expect(testUser).toHaveProperty('appleId')
    expect(testUser).toHaveProperty('tokenInvalidator')

    // intercept to apply the transformer DTO
    const userObservable = interceptor.intercept(context, handler)
    const user = await lastValueFrom(userObservable)

    // test if required properties are present after intercepting
    expect(user.id).toEqual(testUser.id)
    expect(user.email).toEqual(testUser.email)
    expect(user.username).toEqual(testUser.username)

    // test if sensitive properties are stripped off after intercepting
    expect(user).not.toHaveProperty('hashedPassword')
    expect(user).not.toHaveProperty('googleId')
    expect(user).not.toHaveProperty('facebookId')
    expect(user).not.toHaveProperty('appleId')
    expect(user).not.toHaveProperty('tokenInvalidator')
  })
})
