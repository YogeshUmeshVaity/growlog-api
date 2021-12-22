import { plainToInstance } from 'class-transformer'
import { validate } from 'class-validator'
import {
  userWithInvalidEmail,
  userWithPasswordSevenChars,
  userWithUsernameTwoChars
} from '../../../test/users/fixtures/sign-up.fixtures'
import { stringified } from '../../../test/utils/test.utils'
import { MIN_LENGTH_PASSWORD, MIN_LENGTH_USERNAME, SignUpDto } from './signup-user.dto'

describe(`SignUpDto`, () => {
  it(`should throw when username less than ${MIN_LENGTH_USERNAME} characters.`, async () => {
    const signUpDto = plainToInstance(SignUpDto, userWithUsernameTwoChars)
    const errors = await validate(signUpDto /*{ skipMissingProperties: true }*/)
    expect(stringified(errors)).toContain(
      `Username must be at least ${MIN_LENGTH_USERNAME} characters long.`
    )
  })

  it(`should throw when email is invalid.`, async () => {
    const signUpDto = plainToInstance(SignUpDto, userWithInvalidEmail)
    const errors = await validate(signUpDto)
    expect(stringified(errors)).toContain(`Please enter a valid email address.`)
  })

  it(`should throw when password less than ${MIN_LENGTH_PASSWORD} characters.`, async () => {
    const signUpDto = plainToInstance(SignUpDto, userWithPasswordSevenChars)
    const errors = await validate(signUpDto)
    expect(stringified(errors)).toContain(
      `Password must be at least ${MIN_LENGTH_PASSWORD} characters long.`
    )
  })
})
