import { EmailValidations } from '../../users/dtos/signup-user.dto'

export class RecoverPasswordDto {
  @EmailValidations()
  readonly email: string
}
