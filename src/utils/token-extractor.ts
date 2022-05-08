import { UnauthorizedException } from '@nestjs/common'
import { Request } from 'express'

/**
 * Extracts the access token from the request object's authorization headers.
 * @param request is the http request object.
 * @returns just the access token. Throws errors if no authorization header or no bearer prefix is
 * found.
 */
export function extractTokenFrom(request: Request) {
  const authorizationArray = request.headers.authorization?.split(' ')
  throwIfNoAuthHeader(authorizationArray)

  const tokenPrefix = authorizationArray[0]
  const token = authorizationArray[1]

  throwIfNoBearerPrefix(tokenPrefix)
  throwIfNoToken(token)

  return token
}

function throwIfNoToken(token: string) {
  if (!token) {
    throw new UnauthorizedException('Token was not provided.')
  }
}

function throwIfNoBearerPrefix(tokenPrefix: string) {
  if (tokenPrefix.toLowerCase() !== 'bearer') {
    throw new UnauthorizedException('Authorization type is not valid.')
  }
}

function throwIfNoAuthHeader(authorizationArray: string[]) {
  if (!authorizationArray) {
    throw new UnauthorizedException('Token was not found.')
  }
}
