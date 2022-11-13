import { Body, Controller, Get, Post } from '@nestjs/common'
import { RecoverPasswordDto } from './dtos/recover-password.dto'
import { SetNewPasswordDto } from './dtos/set-new-password.dto'
import { ValidateCodeDto } from './dtos/validate-code.dto'
import { PasswordRecoveryService } from './password-recovery.service'

/**
 * Handles the routes related to the account recovery of the User.
 * How does it work?
 * 1. User provides an email address to the route recover-password.
 * 2. The recover-password creates a recovery code and sends it via email.
 * 3. User enters the recovery code in the 'Validate Code' screen.
 * 4. The validate-code route validates the code and sends the code back along with the username.
 * 5. If the code is valid, the 'Set New Password' screen displays the username and a form to set
 *    the new password.
 * 6. set-new-password route validates the code and sets the new password.
 */
@Controller('password-recovery')
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
    return await this.passwordRecoveryService.recoverPassword(recoverDto.email)
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

  /**
   * Resets the password after validating the recovery code.
   * @param passwords contains the fields recoveryCode, newPassword and confirmPassword.
   */
  @Post('set-new-password')
  async setNewPassword(@Body() passwords: SetNewPasswordDto) {
    return await this.passwordRecoveryService.setNewPassword(passwords)
  }
}
