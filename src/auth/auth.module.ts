import { Module } from '@nestjs/common'
import { JwtModule } from '@nestjs/jwt'
import { AuthService } from './auth.service'

@Module({
  imports: [JwtModule.register(null)],
  providers: [AuthService],
  exports: [JwtModule]
})
export class AuthModule {}
