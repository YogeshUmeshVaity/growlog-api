import {
  Body,
  Controller,
  Get,
  Post,
  Put,
  Req,
  UseGuards
} from '@nestjs/common'
import { Request } from 'express'
import { JwtAuthGuard } from '../auth/jwt-auth.guard'
import { Serialize } from '../utils/interceptors/serializer.interceptor'
import { extractTokenFrom } from '../utils/token-extractor'
import { CurrentUser } from './decorators/current-user.decorator'
import { LoginDto } from './dtos/login.dto'
import { SignUpDto } from './dtos/signup-user.dto'
import { UserDto } from './dtos/user.dto'
import { User } from './user.entity'
import { UsersService } from './users.service'

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post('sign-up')
  async signUp(@Body() userInfo: SignUpDto) {
    return await this.usersService.signUp(userInfo)
  }

  @Post('login')
  async login(@Body() credentials: LoginDto) {
    return await this.usersService.login(
      credentials.username,
      credentials.password
    )
  }

  @Post('google-login')
  async loginWithGoogle(@Req() request: Request) {
    const googleAccessToken = extractTokenFrom(request)
    return await this.usersService.loginWithGoogle(googleAccessToken)
  }

  @Post('logout-other-devices')
  @UseGuards(JwtAuthGuard)
  async logoutOtherDevices(@CurrentUser() user: User) {
    return await this.usersService.logoutOtherDevices(user)
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @Serialize(UserDto) // Can be moved to the entire controller, if there are more instances of it.
  findMe(@CurrentUser() user: User) {
    return user
  }

  @Put('update-username')
  @UseGuards(JwtAuthGuard)
  updateUsername(
    @CurrentUser() user: User,
    @Body('username') username: string
  ) {
    return this.usersService.updateUsername(user, username)
  }
}
