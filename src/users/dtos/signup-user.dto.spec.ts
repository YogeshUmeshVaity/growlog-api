import { plainToInstance } from 'class-transformer'
import { validate } from 'class-validator'
import {
  userWithConfirmPasswordEmpty,
  userWithCorrectInfo,
  userWithEmailSpaces,
  userWithInvalidEmail,
  userWithPasswordSevenChars,
  userWithPasswordWithoutDigit,
  userWithPasswordWithoutSpecialChars,
  userWithUsernameSpaces,
  userWithUsernameSpecialChars,
  userWithUsernameTwentyTwoChars,
  userWithUsernameTwoChars
} from '../../../test/auth/fixtures/sign-up.fixtures'
import { stringified } from '../../../test/utils/test.utils'
import {
  MAX_LENGTH_USERNAME,
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

  it(`should throw when username more than ${MAX_LENGTH_USERNAME} characters.`, async () => {
    const signUpDto = plainToInstance(SignUpDto, userWithUsernameTwentyTwoChars)
    const errors = await validate(signUpDto)
    expect(stringified(errors)).toContain(
      `Username can be maximum ${MAX_LENGTH_USERNAME} characters long.`
    )
  })

  it(`should throw when username contains special characters.`, async () => {
    const signUpDto = plainToInstance(SignUpDto, userWithUsernameSpecialChars)
    const errors = await validate(signUpDto)
    expect(stringified(errors)).toContain(
      `Username can contain only letters and numbers.`
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

  it(`should throw when confirm-password is empty.`, async () => {
    const signUpDto = plainToInstance(SignUpDto, userWithConfirmPasswordEmpty)
    const errors = await validate(signUpDto)
    expect(stringified(errors)).toContain(`Confirm Password must not be empty.`)
  })

  it(`should trim the spaces in username.`, async () => {
    expect(userWithUsernameSpaces.username).toContain(' ') // before
    const signUpDto = plainToInstance(SignUpDto, userWithUsernameSpaces)
    expect(signUpDto.username).toEqual(userWithCorrectInfo.username) // after
  })

  it(`should trim the spaces in email.`, async () => {
    expect(userWithEmailSpaces.email).toContain(' ')
    const signUpDto = plainToInstance(SignUpDto, userWithEmailSpaces)
    expect(signUpDto.email).toEqual(userWithCorrectInfo.email)
  })
})
