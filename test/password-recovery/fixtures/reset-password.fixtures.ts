import { ResetPasswordDto } from '../../../src/password-recovery/dtos/reset-password.dto'
import {
  userWithCorrectInfo as signUpInfo,
  userWithPasswordSevenChars,
  userWithPasswordWithoutDigit,
  userWithPasswordWithoutSpecialChars
} from '../../users/fixtures/sign-up.fixtures'
import {
  correctPasswords,
  wrongConfirmPassword
} from '../../users/fixtures/update-password.fixtures'
import { recoveryCode } from './recover-password.fixtures'

export const validPasswords: ResetPasswordDto = {
  recoveryCode: recoveryCode,
  newPassword: correctPasswords.newPassword,
  confirmPassword: correctPasswords.confirmPassword
}

export const mismatchedPasswords: ResetPasswordDto = {
  recoveryCode: recoveryCode,
  newPassword: wrongConfirmPassword.newPassword,
  confirmPassword: wrongConfirmPassword.confirmPassword
}

/**
 * Constructs a ResetPasswordDTO of valid passwords with the provided recovery code.
 * @param recoveryCode is the real recovery code retrieved from the email.
 */
export function validPasswordsWith(recoveryCode: string): ResetPasswordDto {
  return {
    recoveryCode: recoveryCode,
    newPassword: correctPasswords.newPassword,
    confirmPassword: correctPasswords.confirmPassword
  }
}

/**
 * Constructs a ResetPasswordDTO of mismatched passwords with the provided recovery code.
 * @param recoveryCode is the real recovery code retrieved from the email.
 */
export function mismatchedPasswordsWith(
  recoveryCode: string
): ResetPasswordDto {
  return {
    recoveryCode: recoveryCode,
    newPassword: wrongConfirmPassword.newPassword,
    confirmPassword: wrongConfirmPassword.confirmPassword
  }
}

/**
 * Constructs a ResetPasswordDTO of old passwords with the provided recovery code.
 * @param recoveryCode is the real recovery code retrieved from the email.
 */
export function oldPasswordsWith(recoveryCode: string): ResetPasswordDto {
  return {
    recoveryCode: recoveryCode,
    newPassword: signUpInfo.password,
    confirmPassword: signUpInfo.confirmPassword
  }
}

/**
 * Constructs a ResetPasswordDTO of 7 char(invalid) passwords with the provided recovery code.
 * @param recoveryCode is the real recovery code retrieved from the email.
 */
export function shortPasswordsWith(recoveryCode: string): ResetPasswordDto {
  return {
    recoveryCode: recoveryCode,
    newPassword: userWithPasswordSevenChars.password,
    confirmPassword: userWithPasswordSevenChars.confirmPassword
  }
}

/**
 * Constructs a ResetPasswordDTO of passwords without a special character with the provided recovery
 * code.
 * @param recoveryCode is the real recovery code retrieved from the email.
 */
export function noSpecialCharPasswordsWith(
  recoveryCode: string
): ResetPasswordDto {
  return {
    recoveryCode: recoveryCode,
    newPassword: userWithPasswordWithoutSpecialChars.password,
    confirmPassword: userWithPasswordWithoutSpecialChars.confirmPassword
  }
}

/**
 * Constructs a ResetPasswordDTO of passwords without a digit with the provided recovery
 * code.
 * @param recoveryCode is the real recovery code retrieved from the email.
 */
export function noDigitPasswordsWith(recoveryCode: string): ResetPasswordDto {
  return {
    recoveryCode: recoveryCode,
    newPassword: userWithPasswordWithoutDigit.password,
    confirmPassword: userWithPasswordWithoutDigit.confirmPassword
  }
}
