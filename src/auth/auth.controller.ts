import { Body, Controller, Post, Put, Req, UseGuards } from '@nestjs/common'
import { Request } from 'express'
import { JwtAuthGuard } from '../auth/jwt-auth.guard'
import { CurrentUser } from '../users/decorators/current-user.decorator'
import { LoginDto } from '../users/dtos/login.dto'
import { SignUpDto } from '../users/dtos/signup-user.dto'
import { UpdatePasswordDto } from '../users/dtos/update-password.dto'
import { User } from '../users/user.entity'
import { extractTokenFrom } from '../utils/token-extractor'
import { AuthService } from './auth.service'

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('sign-up')
  async signUp(@Body() userInfo: SignUpDto) {
    return await this.authService.signUp(userInfo)
  }

  @Post('login')
  async login(@Body() credentials: LoginDto) {
    return await this.authService.login(
      credentials.username,
      credentials.password
    )
  }

  @Put('update-password')
  @UseGuards(JwtAuthGuard)
  async updatePassword(
    @CurrentUser() user: User,
    @Body() passwordDto: UpdatePasswordDto
  ) {
    return await this.authService.updatePassword(user, passwordDto)
  }

  @Post('google-login')
  async loginWithGoogle(@Req() request: Request) {
    const googleAccessToken = extractTokenFrom(request)
    return await this.authService.loginWithGoogle(googleAccessToken)
  }

  @Post('logout-other-devices')
  @UseGuards(JwtAuthGuard)
  async logoutOtherDevices(@CurrentUser() user: User) {
    return await this.authService.logoutOtherDevices(user)
  }
}
