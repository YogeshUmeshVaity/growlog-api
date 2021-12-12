import { IsEmail, IsString, Matches, MinLength } from 'class-validator'

// Note: It's not a good practice to have max length on passwords, usernames and emails.
// https://stackoverflow.com/a/3797135/5925259

// Password Regex: ^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9])(?=.*?[#?!@$%^&*-]).{8,}$
// At least one upper case English letter: (?=.*?[A-Z])
// At least one lower case English letter: (?=.*?[a-z])
// At least one digit: (?=.*?[0-9])
// At least one special character: (?=.*?[#?!@$%^&*-])
// Minimum eight in length: .{8,} (with the anchors)
// Remove the above groups as per the requirement to reduce the password strength.
// For example, in the regex used below we just want 1 number and 1 special character. So we omitted
// other groups.

const MIN_USERNAME_LENGTH = 3

export class SignupDto {
  @IsString()
  @MinLength(MIN_USERNAME_LENGTH)
  username: string

  @IsEmail()
  email: string

  @IsString()
  @Matches(/^(?=.*?[0-9])(?=.*?[#?!@$%^&*-]).{8,}$/, {
    message: 'Password must contain at least 1 digit and 1 special character.',
  })
  password: string

  @IsString()
  confirmPassword: string
}
