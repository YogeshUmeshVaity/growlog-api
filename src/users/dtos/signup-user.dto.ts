import { Transform, TransformFnParams } from 'class-transformer'
import {
  IsEmail,
  IsNotEmpty,
  IsString,
  Matches,
  MaxLength,
  MinLength
} from 'class-validator'

/*
 * Note: It's not a good practice to have max length on passwords, usernames and emails:
 * https://stackoverflow.com/a/3797135/5925259
 *
 * Password Regex: ^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9])(?=.*?[#?!@$%^&*-]).{8,}$
 * At least one upper case English letter: (?=.*?[A-Z])
 * At least one lower case English letter: (?=.*?[a-z])
 * At least one digit: (?=.*?[0-9])
 * At least one special character: (?=.*?[#?!@$%^&*-])
 * Minimum eight in length: .{8,} (with the anchors)
 * For no minimum length: .*
 * Remove the above groups as per the requirement to reduce the password strength.
 * For example, in the regex used below we just want 1 digit and 1 special character. So we omitted
 * other groups.
 */

export const MIN_LENGTH_USERNAME = 3
export const MAX_LENGTH_USERNAME = 21
export const MIN_LENGTH_PASSWORD = 8

/**
 * Requires 1 digit and 1 special character. The dot means anything can go here and the star means
 * at least 0 times so .* accepts any sequence of characters, including an empty string.
 */
const regexOneDigitOneSpecialChar = /^(?=.*?[0-9])(?=.*?[#?!@$%^&*-]).*$/

/**
 * Allows only letters and numbers.
 */
const regexLettersAndNumbers = /^[a-zA-Z0-9._]+$/

export class SignUpDto {
  @IsString()
  @MinLength(MIN_LENGTH_USERNAME, {
    message: `Username must be at least ${MIN_LENGTH_USERNAME} characters long.`
  })
  @MaxLength(MAX_LENGTH_USERNAME, {
    message: `Username can be maximum ${MAX_LENGTH_USERNAME} characters long.`
  })
  @Matches(regexLettersAndNumbers, {
    message: `Username can contain only letters, numbers, underscores (_) and periods (.).`
  })
  @Transform(({ value }: TransformFnParams) => value.trim()) // trim spaces
  readonly username: string

  @IsEmail({}, { message: 'Please enter a valid email address.' })
  @Transform(({ value }: TransformFnParams) => value.trim())
  readonly email: string

  @MinLength(MIN_LENGTH_PASSWORD, {
    message: `Password must be at least ${MIN_LENGTH_PASSWORD} characters long.`
  })
  @Matches(regexOneDigitOneSpecialChar, {
    message: 'Password must contain at least 1 digit and 1 special character.'
  })
  readonly password: string

  // Empty check is required because we check the equality first.
  @IsString()
  @IsNotEmpty({ message: `Confirm Password must not be empty.` })
  readonly confirmPassword: string
}
