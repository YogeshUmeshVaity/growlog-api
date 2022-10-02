import { Body, Controller, Post } from '@nestjs/common'
import { RecoverPasswordDto } from './dtos/recover-password.dto'
import { RecoveryService } from './recovery.service'

@Controller('recovery')
export class RecoveryController {
  constructor(private readonly recoveryService: RecoveryService) {}

  @Post('recover-password')
  recoverPassword(@Body() recoverDto: RecoverPasswordDto) {
    return this.recoveryService.recoverPassword(recoverDto.email)
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
