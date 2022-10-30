import { ValidateCodeDto } from '../../../src/password-recovery/dtos/validate-code.dto'
import { PasswordRecovery } from '../../../src/password-recovery/password-recovery.entity'
import {
  recoveryCode,
  sampleRecoveryUsername,
  userWithRecovery
} from './recover-password.fixtures'
import * as dotenv from 'dotenv'

/**
 * Tells the TypeScript that we have RECOVERY_CODE_EXPIRY_MINUTES variable as a 'number'
 * in our process.env.
 */
declare let process: {
  env: {
    RECOVERY_CODE_EXPIRY_MINUTES: number
  }
}

export const validCode: ValidateCodeDto = {
  username: sampleRecoveryUsername,
  recoveryCode: recoveryCode
}

export const invalidCode: ValidateCodeDto = {
  username: sampleRecoveryUsername,
  recoveryCode:
    'Some-Other-64-Characters-Long-Code-With-Any-Characters-You-Want-'
}

// Used for testing the sanitation related to trimming the spaces.
export const codeWithSpaces: ValidateCodeDto = {
  username: ' ' + sampleRecoveryUsername + ' ',
  recoveryCode: ' ' + recoveryCode + ' '
}

export const codeWithInvalidUsername: ValidateCodeDto = {
  username: 'SomeOtherUser',
  recoveryCode: recoveryCode
}

export function validRecovery(): PasswordRecovery {
  const recovery = new PasswordRecovery()
  recovery.expiration = validExpiryTime()
  recovery.user = userWithRecovery()
  return recovery
}

export function expiredRecovery(): PasswordRecovery {
  const recovery = validRecovery()
  recovery.expiration = invalidExpiryTime()
  return recovery
}

/**
 * Loads RECOVERY_CODE_EXPIRY_MINUTES from the file: .env.test. We do this because, we don't want to
 * test for a constant value. The minutes value can be anything that the developer using this
 * project can set through an environment variable. This way our test code will not change, if the
 * RECOVERY_CODE_EXPIRY_MINUTES changes.
 */
function expiryMinutes() {
  dotenv.config({ path: '.env.test' })
  return process.env.RECOVERY_CODE_EXPIRY_MINUTES
}

/**
 * 60000 milliseconds = 1 minute. So, we multiply the given minutes by 60000.
 */
function validExpiryTime() {
  return new Date(Date.now() + expiryMinutes() * 60000)
}

function invalidExpiryTime() {
  return new Date(Date.now() - 1)
}
