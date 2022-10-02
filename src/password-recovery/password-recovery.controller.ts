import { Body, Controller, Post } from '@nestjs/common'
import { RecoverPasswordDto } from './dtos/recover-password.dto'
import { PasswordRecoveryService } from './password-recovery.service'

@Controller('recovery')
export class RecoveryController {
  constructor(
    private readonly passwordRecoveryService: PasswordRecoveryService
  ) {}

  @Post('recover-password')
  recoverPassword(@Body() recoverDto: RecoverPasswordDto) {
    return this.passwordRecoveryService.recover(recoverDto.email)
  }

  // @Get(':recoveryCode')
  // validateRecoveryLink(@Param() recoveryCode: string) {
  //   throw new NotImplementedException()
  // }

  // @Post('change-password')
  // changePassword(
  //   @Param() recoveryCode: string,
  //   @Body() passwords: UpdatePasswordDto
  // ) {
  //   throw new NotImplementedException()
  // }
}
