import { Controller, Get, Post } from '@nestjs/common'
import { UsersService } from './users.service'

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  findMe() {
    return { username: 'test', email: 'test@test.com' }
  }

  @Post()
  create() {
    return this.usersService.create()
  }
}
