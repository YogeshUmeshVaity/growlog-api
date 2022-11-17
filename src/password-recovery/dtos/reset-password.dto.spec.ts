import { plainToInstance } from 'class-transformer'
import { validate } from 'class-validator'
import {
  recoveryCode,
  shortRecoveryCode
} from '../../../test/password-recovery/fixtures/recover-password.fixtures'
import {
  noDigitPasswordsWith,
  noSpecialCharPasswordsWith,
  shortPasswordsWith,
  validPasswordsWith
} from '../../../test/password-recovery/fixtures/reset-password.fixtures'
import { stringified } from '../../../test/utils/test.utils'
import { MIN_LENGTH_PASSWORD } from '../../users/dtos/signup-user.dto'
import { ResetPasswordDto } from './reset-password.dto'
import { RECOVERY_CODE_LENGTH } from './validate-code.dto'

describe(`ResetPasswordDto`, () => {
  it(`should throw when length of the code is not ${RECOVERY_CODE_LENGTH}.`, async () => {
    const resetPasswordDto = plainToInstance(
      ResetPasswordDto,
      validPasswordsWith(shortRecoveryCode)
    )
    const errors = await validate(resetPasswordDto)

    expect(stringified(errors)).toContain(
      `Recovery code must be exactly ${RECOVERY_CODE_LENGTH} characters long.`
    )
  })

  it(`should throw when length of the new password is less than ${MIN_LENGTH_PASSWORD}.`, async () => {
    const resetPasswordDto = plainToInstance(
      ResetPasswordDto,
      shortPasswordsWith(recoveryCode)
    )
    const errors = await validate(resetPasswordDto)

    expect(stringified(errors)).toContain(
      `New Password must be at least ${MIN_LENGTH_PASSWORD} characters long.`
    )
  })

  it(`should throw when the new password doesn't contain a special character.`, async () => {
    const resetPasswordDto = plainToInstance(
      ResetPasswordDto,
      noSpecialCharPasswordsWith(recoveryCode)
    )
    const errors = await validate(resetPasswordDto)

    expect(stringified(errors)).toContain(
      `Password must contain at least 1 digit and 1 special character.`
    )
  })

  it(`should throw when the new password doesn't contain a digit.`, async () => {
    const resetPasswordDto = plainToInstance(
      ResetPasswordDto,
      noDigitPasswordsWith(recoveryCode)
    )
    const errors = await validate(resetPasswordDto)

    expect(stringified(errors)).toContain(
      `Password must contain at least 1 digit and 1 special character.`
    )
  })

  it(`should trim the outer spaces in the recovery code.`, async () => {
    const spaces = '  '
    const codeWithSpaces = spaces + recoveryCode + spaces

    // Before validation
    expect(codeWithSpaces).toContain(spaces)

    // transformation
    const resetPasswordDto = plainToInstance(
      ResetPasswordDto,
      validPasswordsWith(codeWithSpaces)
    )

    // After validation
    expect(resetPasswordDto.recoveryCode).not.toContain(spaces)
  })
})
