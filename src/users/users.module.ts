import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { AuthModule } from '../auth/auth.module'
import { AuthService } from '../auth/auth.service'
import { UsersController } from './users.controller'
import { UsersRepository } from './users.repository'
import { UsersService } from './users.service'

@Module({
  imports: [TypeOrmModule.forFeature([UsersRepository]), AuthModule],
  controllers: [UsersController],
  providers: [UsersService, AuthService]
})
export class UsersModule {}
