import { Body, Controller, Get, Post } from '@nestjs/common'
import { RecoverPasswordDto } from './dtos/recover-password.dto'
import { ValidateCodeDto } from './dtos/validate-code.dto'
import { PasswordRecoveryService } from './password-recovery.service'

/**
 * Handles the routes related to the account recovery of the User.
 */
@Controller('recovery')
export class PasswordRecoveryController {
  constructor(
    private readonly passwordRecoveryService: PasswordRecoveryService
  ) {}

  /**
   * Sends a recovery email with a recovery code to the user's email address.
   * @param recoverDto is a validated email address.
   */
  @Post('recover-password')
  async recoverPassword(@Body() recoverDto: RecoverPasswordDto) {
    return await this.passwordRecoveryService.recover(recoverDto.email)
  }

  /**
   * Checks whether the recovery code provided by the user is valid. This is used before showing
   * the password reset screen.
   * @param validateCodeDto contains recovery code and username.
   * @returns the same recovery code and username.
   */
  @Get('validate-code')
  async validateCode(@Body() validateCodeDto: ValidateCodeDto) {
    return await this.passwordRecoveryService.validateCode(validateCodeDto)
  }

  // @Post('change-password')
  // changePassword(
  //   @Param() recoveryCode: string,
  //   @Body() passwords: UpdatePasswordDto
  // ) {
  //   throw new NotImplementedException()
  // }
}
