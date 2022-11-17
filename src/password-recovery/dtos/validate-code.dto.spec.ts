import { plainToInstance } from 'class-transformer'
import { validate } from 'class-validator'
import {
  recoveryCode,
  shortRecoveryCode
} from '../../../test/password-recovery/fixtures/recover-password.fixtures'
import { stringified } from '../../../test/utils/test.utils'
import { RECOVERY_CODE_LENGTH, ValidateCodeDto } from './validate-code.dto'

describe(`ValidateCodeDto`, () => {
  it(`should trim the outer spaces in the recovery code.`, async () => {
    const spaces = '  '
    const codeWithSpaces = spaces + recoveryCode + spaces
    const codeWithSpacesObject = { recoveryCode: codeWithSpaces }

    // Before validation
    expect(codeWithSpacesObject.recoveryCode).toContain(spaces)

    // validation
    const validateCodeDto = plainToInstance(
      ValidateCodeDto,
      codeWithSpacesObject
    )

    // After validation
    expect(validateCodeDto.recoveryCode).not.toContain(spaces)
  })

  it(`should throw when length of the code is not ${RECOVERY_CODE_LENGTH}.`, async () => {
    const shortRecoveryCodeObject = { recoveryCode: shortRecoveryCode }
    const validateCodeDto = plainToInstance(
      ValidateCodeDto,
      shortRecoveryCodeObject
    )
    const errors = await validate(validateCodeDto)

    expect(stringified(errors)).toContain(
      `Recovery code must be exactly ${RECOVERY_CODE_LENGTH} characters long.`
    )
  })
})
