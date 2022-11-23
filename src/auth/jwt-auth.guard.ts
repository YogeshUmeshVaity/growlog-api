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
import { User } from '../users/user.entity'
import { UsersService } from '../users/users.service'
import { extractTokenFrom } from '../utils/token-extractor'
import { AuthService } from './auth.service'

export const IS_PUBLIC_ROUTE_KEY = 'isPublicRoute'

/**
 * When the JwtAuthGuard is applied to an entire Controller
 */
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
    if (this.isPublicRoute(context)) {
      return true
    } else {
      await this.validateToken(context)
      return true
    }
  }

  private async validateToken(context: ExecutionContext) {
    const request = this.getRequestFrom(context)
    const token = extractTokenFrom(request)
    const id = this.getUserIdFrom(token)
    const user = await this.findUserBy(id)
    await this.throwIfNotFound(user)
    await this.authService.verifyTokenFor(user, token)
    this.assignUserInRequestObject(request, user)
  }

  private getRequestFrom(context: ExecutionContext): Request {
    return context.switchToHttp().getRequest()
  }

  private assignUserInRequestObject(request: Request, user: User) {
    request.user = user
  }

  private isPublicRoute(context: ExecutionContext) {
    const isPublicRoute = this.reflector.get<boolean>(
      IS_PUBLIC_ROUTE_KEY,
      context.getHandler()
    )
    return isPublicRoute
  }

  private async throwIfNotFound(user: User) {
    if (!user) {
      throw new NotFoundException('User was not found.')
    }
  }

  private async findUserBy(userId: string) {
    return await this.usersService.findById(userId)
  }

  private getUserIdFrom(token: string) {
    const decodedToken = this.jwtService.decode(token) as DecodedToken

    if (!decodedToken) {
      throw new UnauthorizedException('Unable to decode the provided token.')
    }
    return decodedToken.userId
  }
}
