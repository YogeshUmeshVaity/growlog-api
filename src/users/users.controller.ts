import { Body, Controller, Get, Put, UseGuards } from '@nestjs/common'
import { JwtAuthGuard } from '../auth/jwt-auth.guard'
import { Serialize } from '../utils/interceptors/serializer.interceptor'
import { CurrentUser } from './decorators/current-user.decorator'
import { UpdatePasswordDto } from './dtos/update-password.dto'
import { UserDto } from './dtos/user.dto'
import { User } from './user.entity'
import { UsersService } from './users.service'

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @Serialize(UserDto) // Can be moved to the entire controller, if there are more instances of it.
  findMe(@CurrentUser() user: User) {
    return user
  }

  @Put('update-username')
  @UseGuards(JwtAuthGuard)
  async updateUsername(
    @CurrentUser() user: User,
    @Body('username') username: string
  ) {
    return await this.usersService.updateUsername(user, username)
  }

  @Put('update-email')
  @UseGuards(JwtAuthGuard)
  async updateEmail(@CurrentUser() user: User, @Body('email') email: string) {
    return await this.usersService.updateEmail(user, email)
  }
}
