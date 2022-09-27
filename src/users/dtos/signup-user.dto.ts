import { applyDecorators } from '@nestjs/common'
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
 * Requires 1 digit and 1 special character for the password. The dot means anything can go here
 * and the star means at least 0 times so .* accepts any sequence of characters, including an empty
 * string. Emptiness is checked separately using a decorator.
 */
const regexOneDigitOneSpecialChar = /^(?=.*?[0-9])(?=.*?[#?!@$%^&*-]).*$/

/**
 * For medium scale apps, use letters and numbers username regex: /^[a-zA-Z0-9]+$/
 *
 * For serious and large scale apps, use the stricter username regex:
 * /^(?=[a-zA-Z0-9._]{3,21}$)(?!.*[_.]{2})[^_.].*[^_.]$/
 *
 * 1. Only contains alphanumeric characters, underscore and dot.
 * 2. Underscore and dot can't be at the end or start of a username.
 *    (e.g _username / username_ / .username / username.)
 * 3. Underscore and dot can't be next to each other (e.g user_.name).
 * 4. Underscore or dot can't be used multiple times in a row (e.g user__name / user..name).
 * 5. Number of characters must be between 3 to 21.
 *
 * For more info: https://stackoverflow.com/q/12018245/5925259
 */
const regexLettersAndNumbers = /^[a-zA-Z0-9]+$/

export class SignUpDto {
  @UsernameValidations()
  readonly username: string

  @EmailValidations()
  readonly email: string

  @PasswordValidations()
  readonly password: string

  @ConfirmPasswordValidations()
  readonly confirmPassword: string
}

export function UsernameValidations() {
  return applyDecorators(
    IsString(),

    MinLength(MIN_LENGTH_USERNAME, {
      message: `Username must be at least ${MIN_LENGTH_USERNAME} characters long.`
    }),

    MaxLength(MAX_LENGTH_USERNAME, {
      message: `Username can be maximum ${MAX_LENGTH_USERNAME} characters long.`
    }),

    Matches(regexLettersAndNumbers, {
      message: `Username can contain only letters and numbers.`
    }),

    Transform(({ value }: TransformFnParams) => value.trim()) // trim spaces
  )
}

export function EmailValidations() {
  return applyDecorators(
    IsEmail({}, { message: 'Please enter a valid email address.' }),

    Transform(({ value }: TransformFnParams) => value.trim())
  )
}

export function PasswordValidations() {
  return applyDecorators(
    MinLength(MIN_LENGTH_PASSWORD, {
      message: `Password must be at least ${MIN_LENGTH_PASSWORD} characters long.`
    }),

    Matches(regexOneDigitOneSpecialChar, {
      message: 'Password must contain at least 1 digit and 1 special character.'
    })
  )
}

export function ConfirmPasswordValidations() {
  return applyDecorators(
    IsString(),

    // Empty check is required because we check the equality first.
    IsNotEmpty({ message: `Confirm Password must not be empty.` })
  )
}
