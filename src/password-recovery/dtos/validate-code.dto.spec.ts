import { plainToInstance } from 'class-transformer'
import {
  codeWithSpaces,
  validCode
} from '../../../test/password-recovery/fixtures/validate-code.fixtures'
import { ValidateCodeDto } from './validate-code.dto'

describe(`ValidateCodeDto`, () => {
  it(`should trim the spaces in the recovery code.`, async () => {
    // Before validation
    expect(codeWithSpaces.recoveryCode).toContain(' ')
    const validateCodeDto = plainToInstance(ValidateCodeDto, codeWithSpaces)
    // After validation
    expect(validateCodeDto.recoveryCode).toEqual(validCode.recoveryCode)
  })
})
