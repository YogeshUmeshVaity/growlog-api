import { Module } from '@nestjs/common'
import { JwtModule } from '@nestjs/jwt'
import { AuthService } from './auth.service'

@Module({
  imports: [JwtModule.register(null) /**, UsersModule  */],
  providers: [AuthService /**, JwtAuthGuard, UsersService */],
  exports: [JwtModule]
})
export class AuthModule {}
