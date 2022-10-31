import { applyDecorators } from '@nestjs/common'
import { Transform, TransformFnParams } from 'class-transformer'
import { MaxLength, MinLength } from 'class-validator'

export const RECOVERY_CODE_LENGTH = 64

export class ValidateCodeDto {
  @RecoveryCodeValidations()
  readonly recoveryCode: string
}

export function RecoveryCodeValidations() {
  return applyDecorators(
    // Without these constraints, the incoming dto doesn't include the recoveryCode property
    MinLength(RECOVERY_CODE_LENGTH, {
      message: `Recovery code must be exactly ${RECOVERY_CODE_LENGTH} characters long.`
    }),

    MaxLength(RECOVERY_CODE_LENGTH, {
      message: `Recovery code must be exactly ${RECOVERY_CODE_LENGTH} characters long.`
    }),

    Transform(({ value }: TransformFnParams) => value.trim()) // trim spaces
  )
}
