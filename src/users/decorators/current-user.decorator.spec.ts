import { createMock } from '@golevelup/ts-jest'
import { ExecutionContext } from '@nestjs/common'
import { sampleUser } from '../../../test/users/fixtures/find-me.fixtures'
import { getParamDecoratorFactory } from '../../../test/utils/test.utils'
import { CurrentUser } from './current-user.decorator'

describe(`CurrentUser decorator`, () => {
  it(`should provide current user object.`, async () => {
    const context = createMock<ExecutionContext>({
      switchToHttp: () => ({
        getRequest: () => ({
          user: sampleUser()
        })
      })
    })
    const factory = getParamDecoratorFactory(CurrentUser)
    const returnedUser = factory(null, context)
    expect(returnedUser.id).toEqual(sampleUser().id)
  })
})
