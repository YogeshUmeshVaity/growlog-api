import { PasswordValidations, UsernameValidations } from './signup-user.dto'

export class LoginDto {
  @UsernameValidations()
  readonly username: string

  @PasswordValidations()
  readonly password: string
}
