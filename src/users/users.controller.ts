import {
  Body,
  Controller,
  Get,
  NotImplementedException,
  Post,
} from '@nestjs/common'
import { SignUpDto } from './dtos/signup-user.dto'
import { UsersService } from './users.service'

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post('/sign-up')
  async signup(@Body() body: SignUpDto) {
    return await this.usersService.signUp(body)
  }

  @Get()
  findMe() {
    //TODO:
    throw new NotImplementedException('feature not implemented.')
  }
}
