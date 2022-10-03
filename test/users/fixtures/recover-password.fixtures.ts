import { PasswordRecovery } from '../../../src/password-recovery/password-recovery.entity'
import { User } from '../../../src/users/user.entity'
import { sampleUser } from './find-me.fixtures'

/** For password recovery. */
export const recoveryCode = '123'

/** Password recovery expiration date. */
export const expiration = new Date()

const passwordRecovery = new PasswordRecovery()
passwordRecovery.code = recoveryCode
passwordRecovery.user = sampleUser()
passwordRecovery.expiration = expiration

/**
 * @returns a user object that also contains the passwordRecovery object.
 */
export function userWithRecovery(): User {
  const user = new User()
  user.id = '30ff0b89-7a43-4892-9ccc-86bb5f16e296'
  user.username = 'abcabc123'
  user.email = 'abc@gmail.com'
  user.googleId = '111295779375838005922'
  user.invalidateAllTokens()
  user.passwordRecovery = passwordRecovery
  return user
}
