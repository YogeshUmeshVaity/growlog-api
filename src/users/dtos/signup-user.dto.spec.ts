import { plainToInstance } from 'class-transformer'
import { validate } from 'class-validator'
import {
  userWithCorrectInfo,
  userWithInvalidEmail,
  userWithPasswordSevenChars,
  userWithPasswordWithoutDigit,
  userWithPasswordWithoutSpecialChars,
  userWithSpaces,
  userWithUsernameTwoChars
} from '../../../test/users/fixtures/sign-up.fixtures'
import { stringified } from '../../../test/utils/test.utils'
import {
  MIN_LENGTH_PASSWORD,
  MIN_LENGTH_USERNAME,
  SignUpDto
} from './signup-user.dto'

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

  it(`should throw when password is without any special character.`, async () => {
    const signUpDto = plainToInstance(
      SignUpDto,
      userWithPasswordWithoutSpecialChars
    )
    const errors = await validate(signUpDto)
    expect(stringified(errors)).toContain(
      `Password must contain at least 1 digit and 1 special character.`
    )
  })

  it(`should throw when password is without any digit.`, async () => {
    const signUpDto = plainToInstance(SignUpDto, userWithPasswordWithoutDigit)
    const errors = await validate(signUpDto)
    expect(stringified(errors)).toContain(
      `Password must contain at least 1 digit and 1 special character.`
    )
  })

  it(`should trim the spaces in username and email`, async () => {
    // Expect with spaces.
    expect(userWithSpaces.username).toContain(' ')
    expect(userWithSpaces.email).toContain(' ')
    const signUpDto = plainToInstance(SignUpDto, userWithSpaces)
    // Expect with no spaces.
    expect(signUpDto.username).toEqual(userWithCorrectInfo.username)
    expect(signUpDto.email).toEqual(userWithCorrectInfo.email)
  })
})
