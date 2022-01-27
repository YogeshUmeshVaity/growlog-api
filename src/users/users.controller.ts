import {
  Body,
  Controller,
  Get,
  NotImplementedException,
  Post
} from '@nestjs/common'
import { SignUpDto } from './dtos/signup-user.dto'
import { UsersService } from './users.service'

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post('/sign-up')
  async signUp(@Body() userInfo: SignUpDto) {
    return await this.usersService.signUp(userInfo)
  }

  @Get('/me')
  findMe() {
    //TODO:
    throw new NotImplementedException('feature not implemented.')
  }
}
