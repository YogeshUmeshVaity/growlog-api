import { plainToInstance } from 'class-transformer'
import { validate } from 'class-validator'
import {
  userWithEmailSpaces,
  userWithInvalidEmail
} from '../../../test/users/fixtures/sign-up.fixtures'
import { stringified } from '../../../test/utils/test.utils'
import { RecoverPasswordDto } from './recover-password.dto'

describe(`RecoverPasswordDto`, () => {
  it(`should trim the spaces in email.`, async () => {
    const spaces = '  '
    const emailWithSpaces = spaces + userWithEmailSpaces.email + spaces
    const emailWithSpacesObject = { email: emailWithSpaces }

    // Before validation
    expect(emailWithSpacesObject.email).toContain(spaces)

    // validation
    const recoverPasswordDto = plainToInstance(
      RecoverPasswordDto,
      emailWithSpacesObject
    )

    // After validation
    expect(recoverPasswordDto.email).not.toContain(spaces)
  })

  it(`should throw when email is invalid.`, async () => {
    const invalidEmail = userWithInvalidEmail.email
    const invalidEmailObject = { email: invalidEmail }
    const recoverPasswordDto = plainToInstance(
      RecoverPasswordDto,
      invalidEmailObject
    )
    const errors = await validate(recoverPasswordDto)

    expect(stringified(errors)).toContain(`Please enter a valid email address.`)
  })
})
