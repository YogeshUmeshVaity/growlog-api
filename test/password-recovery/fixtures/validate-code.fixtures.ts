import * as dotenv from 'dotenv'
import { ValidateCodeDto } from '../../../src/password-recovery/dtos/validate-code.dto'
import { PasswordRecovery } from '../../../src/password-recovery/password-recovery.entity'
import { recoveryCode, userWithRecovery } from './recover-password.fixtures'

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
  recoveryCode: recoveryCode
}

export const invalidCode: ValidateCodeDto = {
  recoveryCode:
    'Some-Other-64-Characters-Long-Code-With-Any-Characters-You-Want-'
}

// Used for testing the sanitation related to trimming the spaces.
export const codeWithSpaces: ValidateCodeDto = {
  recoveryCode: ' ' + recoveryCode + ' '
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
export function expiryMinutes() {
  dotenv.config({ path: '.env.test' })
  return process.env.RECOVERY_CODE_EXPIRY_MINUTES
}

/**
 * Sets the current system time to a future time. This is happens for just one call of Date.now().
 * The subsequent calls to Date.now() will return the normal current time.
 * @param minutes is the number of minutes you want to forward the time by.
 */
export function forwardSystemTimeOnceBy(minutes: number) {
  const currentTime = Date.now()
  jest.spyOn(Date, 'now').mockReturnValueOnce(currentTime + minutes * 60000)
  // for a specific time use mockImplementationOnce(() => +new Date('2022-11-11'))
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
