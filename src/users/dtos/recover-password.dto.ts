import { EmailValidations } from './signup-user.dto'

export class RecoverPasswordDto {
  @EmailValidations()
  readonly email: string
}
