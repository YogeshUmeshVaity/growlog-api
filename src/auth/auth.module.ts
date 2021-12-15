import { Module } from '@nestjs/common'
import { JwtModule } from '@nestjs/jwt'
import { AuthService } from './auth.service'

@Module({
  imports: [
    JwtModule.register(null)
    // JwtModule.registerAsync({
    //   imports: [ConfigModule],
    //   useFactory: async (configService: ConfigService) => ({
    //     secret: configService.get<string>('JWT_SECRET'),
    //     signOptions: { expiresIn: configService.get<string>('JWT_EXPIRY') }
    //   }),
    //   inject: [ConfigService]
    // })
  ],
  providers: [AuthService],
  exports: [JwtModule]
})
export class AuthModule {}
