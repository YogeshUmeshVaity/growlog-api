import { UpdatePasswordDto } from '../../../src/users/dtos/update-password.dto'
import { userWithCorrectInfo } from './sign-up.fixtures'

export const correctPasswords: UpdatePasswordDto = {
  currentPassword: userWithCorrectInfo.password,
  newPassword: 'newPass123#',
  confirmPassword: 'newPass123#'
}

export const wrongConfirmPassword: UpdatePasswordDto = {
  currentPassword: userWithCorrectInfo.password,
  newPassword: 'newPass123#',
  confirmPassword: 'newPass124#'
}
