import { applyDecorators } from '@nestjs/common'
import { Matches, MinLength } from 'class-validator'
import {
  ConfirmPasswordValidations,
  MIN_LENGTH_PASSWORD,
  regexOneDigitOneSpecialChar
} from '../../users/dtos/signup-user.dto'
import { RecoveryCodeValidations } from './validate-code.dto'

export class SetNewPasswordDto {
  @RecoveryCodeValidations()
  readonly recoveryCode: string

  @NewPasswordValidations()
  readonly newPassword: string

  @ConfirmPasswordValidations()
  readonly confirmPassword: string
}

function NewPasswordValidations() {
  return applyDecorators(
    MinLength(MIN_LENGTH_PASSWORD, {
      message: `New Password must be at least ${MIN_LENGTH_PASSWORD} characters long.`
    }),

    Matches(regexOneDigitOneSpecialChar, {
      message:
        'New Password must contain at least 1 digit and 1 special character.'
    })
  )
}
