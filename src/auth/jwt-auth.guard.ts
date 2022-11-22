import {
  CanActivate,
  ExecutionContext,
  Injectable,
  NotFoundException,
  SetMetadata,
  UnauthorizedException
} from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import { JwtService } from '@nestjs/jwt'
import { Request } from 'express'
import { UsersService } from '../users/users.service'
import { extractTokenFrom } from '../utils/token-extractor'
import { AuthService } from './auth.service'

export const IS_PUBLIC_ROUTE_KEY = 'isPublicRoute'
export const PublicRoute = () => SetMetadata(IS_PUBLIC_ROUTE_KEY, true)

interface DecodedToken {
  userId: string
  username: string
}

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private jwtService: JwtService,
    private authService: AuthService,
    private usersService: UsersService,
    private reflector: Reflector
  ) {}
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request: Request = context.switchToHttp().getRequest()
    const isPublicRoute = this.checkForPublicRoute(context)

    if (isPublicRoute) {
      return true
    }

    const token = extractTokenFrom(request)
    const userId = this.getUserIdFrom(token)
    const user = await this.verifyUser(userId)
    await this.authService.verifyTokenFor(user, token)
    request.user = user

    return request.user !== null
  }

  private checkForPublicRoute(context: ExecutionContext) {
    const isPublicRoute = this.reflector.get<boolean>(
      IS_PUBLIC_ROUTE_KEY,
      context.getHandler()
    )
    return isPublicRoute
  }

  private async verifyUser(userId: string) {
    const user = await this.usersService.findById(userId)
    if (!user) {
      throw new NotFoundException('User was not found.')
    }
    return user
  }

  private getUserIdFrom(token: string) {
    const decodedToken = this.jwtService.decode(token) as DecodedToken

    if (!decodedToken) {
      throw new UnauthorizedException('Unable to decode the provided token.')
    }
    return decodedToken.userId
  }
}
