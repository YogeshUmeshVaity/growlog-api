import { plainToInstance } from 'class-transformer'
import { validate } from 'class-validator'
import { signUpWithUsernameTwoChars } from '../../../test/users/fixtures/sign-up.fixtures'
import { stringified } from '../../../test/utils/test.utils'
import { MIN_LENGTH_USERNAME, SignUpDto } from './signup-user.dto'

describe(`SignUpDto`, () => {
  it(`should throw when username less than ${MIN_LENGTH_USERNAME} characters.`, async () => {
    const signUpDto = plainToInstance(SignUpDto, signUpWithUsernameTwoChars)
    const errors = await validate(signUpDto, /*{ skipMissingProperties: true }*/)
    expect(stringified(errors)).toContain(
      `Username must be at least ${MIN_LENGTH_USERNAME} characters long.`
    )
  })
})
