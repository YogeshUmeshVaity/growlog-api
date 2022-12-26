import { BadRequestException, Injectable, Logger } from '@nestjs/common'
import { GaxiosResponse } from 'gaxios'
import { google, oauth2_v2 } from 'googleapis'
import { EnvConfigService } from '../env-config/env-config.service'

export type GoogleUser = oauth2_v2.Schema$Userinfo
export type GoogleResponse = GaxiosResponse<oauth2_v2.Schema$Userinfo>

@Injectable()
export class GoogleAuthService {
  private readonly logger = new Logger(GoogleAuthService.name)
  constructor(private readonly config: EnvConfigService) {}
  /**
   * Retrieves user's data from Google.
   * @param accessToken is the token retrieved at client side from Google.
   */
  async getUserData(accessToken: string) {
    const client = new google.auth.OAuth2(
      this.config.googleAuthClientId,
      this.config.googleAuthClientSecret
    )

    client.setCredentials({ access_token: accessToken })
    const oauth2 = google.oauth2({ auth: client, version: 'v2' })

    let userInfo: GoogleResponse
    try {
      userInfo = await oauth2.userinfo.get()
    } catch (error) {
      this.logger.error(error)
      throw new BadRequestException(
        'Invalid Google OAuth2 access token or scopes.',
        'Make sure you got the access token using the same scopes set up in google cloud console.'
      )
    }
    return userInfo.data
  }
}
