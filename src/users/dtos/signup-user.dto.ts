import { Transform, TransformFnParams } from 'class-transformer'
import {
  IsEmail,
  IsNotEmpty,
  IsString,
  Matches,
  MinLength
} from 'class-validator'

// Note: It's not a good practice to have max length on passwords, usernames and emails:
// https://stackoverflow.com/a/3797135/5925259

// Password Regex: ^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9])(?=.*?[#?!@$%^&*-]).{8,}$
// At least one upper case English letter: (?=.*?[A-Z])
// At least one lower case English letter: (?=.*?[a-z])
// At least one digit: (?=.*?[0-9])
// At least one special character: (?=.*?[#?!@$%^&*-])
// Minimum eight in length: .{8,} (with the anchors)
// Remove the above groups as per the requirement to reduce the password strength.
// For example, in the regex used below we just want 1 digit and 1 special character. So we omitted
// other groups.

const MIN_USERNAME_LENGTH = 3

export class SignUpDto {
  @IsString()
  @MinLength(MIN_USERNAME_LENGTH)
  @Transform(({ value }: TransformFnParams) => value.trim()) // trim spaces
  username: string

  @IsEmail()
  @Transform(({ value }: TransformFnParams) => value.trim())
  email: string

  @IsString()
  // Regex: Requires 1 digit and 1 special character.
  @Matches(/^(?=.*?[0-9])(?=.*?[#?!@$%^&*-]).{8,}$/, {
    message: `Password must be 8 characters long and must contain at least 1 digit and 1 special character.`
  })
  password: string

  @IsString()
  // Required because we check the equality first.
  @IsNotEmpty({ message: `Confirm Password must not be empty.` })
  confirmPassword: string
}
