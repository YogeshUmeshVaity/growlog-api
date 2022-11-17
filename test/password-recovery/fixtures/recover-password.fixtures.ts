import { PasswordRecovery } from '../../../src/password-recovery/password-recovery.entity'
import { User } from '../../../src/users/user.entity'
import { sampleUser } from '../../users/fixtures/find-me.fixtures'

//TODO: move this file to test/password-recovery/fixtures

/** For password recovery. */
export const recoveryCode =
  'Q1iN-dBCUEaTiZ1rUV6ve07ZSH8Ilpf2otnJZgd2e3A4-igiRlSWKuaeaV4bdwAZ'

export const shortRecoveryCode = 'shorter-length-recovery-code'

/** Password recovery expiration date. */
export const expiration = new Date()

const samplePasswordRecovery = new PasswordRecovery()
samplePasswordRecovery.code = recoveryCode
samplePasswordRecovery.user = sampleUser()
samplePasswordRecovery.expiration = expiration

export const sampleRecoveryEmail = 'abc@gmail.com'
export const sampleRecoveryUsername = 'SomeUser'
/**
 * @returns a user object that also contains the passwordRecovery object.
 */
export function userWithRecovery(): User {
  const user = new User()
  user.id = '30ff0b89-7a43-4892-9ccc-86bb5f16e296'
  user.username = sampleRecoveryUsername
  user.email = sampleRecoveryEmail
  user.invalidateAllTokens()
  user.passwordRecovery = samplePasswordRecovery
  return user
}

/**
 * @returns a user object with googleId that also contains the passwordRecovery object.
 */
export function googleUserWithRecovery(): User {
  const googleUser = userWithRecovery()
  googleUser.googleId = 'SomeGoogleID'
  return googleUser
}
