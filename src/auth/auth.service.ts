import { Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { JwtService, JwtSignOptions } from '@nestjs/jwt'
import { User } from 'src/users/user.entity'
import { Token } from './dtos/token.dto'

@Injectable()
export class AuthService {
  constructor(
    private readonly configService: ConfigService,
    private readonly jwtService: JwtService
  ) {}

  async logIn(user: User) {
    return await this.generateJwt(user)
  }

  async generateJwt(user: User): Promise<Token> {
    const token = await this.jwtService.signAsync(
      this.jwtPayload(user),
      this.jwtOptions(user)
    )
    return { token }
  }

  private jwtPayload(user: User) {
    return {
      userId: user.id,
      username: user.username
    }
  }

  private jwtOptions(user: User): JwtSignOptions {
    return {
      secret: this.jwtSecret(user),
      expiresIn: this.jwtExpiration()
    }
  }

  private jwtSecret(user: User) {
    return this.configService.get<string>('JWT_SECRET') + user.tokenInvalidator
  }

  private jwtExpiration() {
    return this.configService.get<string>('JWT_EXPIRY')
  }
}
