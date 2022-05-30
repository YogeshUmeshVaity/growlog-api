import {
  PasswordValidations,
  ConfirmPasswordValidations
} from './signup-user.dto'

export class UpdatePasswordDto {
  @PasswordValidations()
  readonly currentPassword: string

  @PasswordValidations()
  readonly newPassword: string

  @ConfirmPasswordValidations()
  readonly confirmPassword: string
}
