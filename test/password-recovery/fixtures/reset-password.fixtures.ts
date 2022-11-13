import { ResetPasswordDto } from '../../../src/password-recovery/dtos/reset-password.dto'
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
