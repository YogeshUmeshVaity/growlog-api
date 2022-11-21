import { Module } from '@nestjs/common'
import { JwtModule } from '@nestjs/jwt'
import { UsersRepository } from '../users/users.repository'
import { AuthService } from './auth.service'
import { GoogleAuthService } from './google-auth.service'
import { AuthController } from './auth.controller'
import { UsersService } from '../users/users.service'

@Module({
  imports: [JwtModule.register(null) /**, UsersModule  */],
  controllers: [AuthController],
  providers: [
    AuthService,
    UsersRepository,
    GoogleAuthService,
    UsersService /**, JwtAuthGuard, UsersService */
  ],
  exports: [JwtModule, AuthService]
})
export class AuthModule {}
