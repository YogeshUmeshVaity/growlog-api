import {
  ConfirmPasswordValidations,
  PasswordValidations
} from '../../users/dtos/signup-user.dto'
import { RecoveryCodeValidations } from './validate-code.dto'

export class SetNewPasswordDto {
  @RecoveryCodeValidations()
  readonly recoveryCode: string

  @PasswordValidations()
  readonly newPassword: string

  @ConfirmPasswordValidations()
  readonly confirmPassword: string
}
