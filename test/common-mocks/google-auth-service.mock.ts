import { BadRequestException, INestApplication } from '@nestjs/common'
import { GoogleAuthService } from '../../src/auth/google-auth.service'
import { sampleUser } from '../users/fixtures/find-me.fixtures'

export async function mockGoogleAuthError(app: INestApplication) {
  const googleAuthService = await app.resolve(GoogleAuthService)
  googleAuthService.getUserData = jest
    .fn()
    .mockRejectedValue(
      new BadRequestException(
        'Invalid Google OAuth2 access token or scopes.',
        'Make sure you got the access token using the same scopes set up in google cloud console.'
      )
    )
}

export async function mockGoogleAuthUserData(app: INestApplication) {
  const googleAuthService = await app.resolve(GoogleAuthService)
  googleAuthService.getUserData = jest.fn().mockResolvedValue({
    id: sampleUser().googleId,
    name: sampleUser().username,
    email: sampleUser().email
  })
}
