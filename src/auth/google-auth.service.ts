import { BadRequestException, Injectable, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { GaxiosResponse } from 'gaxios'
import { google, oauth2_v2 } from 'googleapis'

export type GoogleUser = oauth2_v2.Schema$Userinfo
export type GoogleResponse = GaxiosResponse<oauth2_v2.Schema$Userinfo>

@Injectable()
export class GoogleAuthService {
  private readonly logger = new Logger(GoogleAuthService.name)
  constructor(private readonly configService: ConfigService) {}
  /**
   * Retrieves user's data from Google.
   * @param accessToken is the token retrieved at client side from Google.
   */
  async getUserData(accessToken: string) {
    const client = new google.auth.OAuth2(
      this.configService.get<string>('GOOGLE_OAUTH_CLIENT_ID'),
      this.configService.get<string>('GOOGLE_OAUTH_CLIENT_SECRET')
    )

    client.setCredentials({ access_token: accessToken })
    const oauth2 = google.oauth2({ auth: client, version: 'v2' })

    let userInfo: GoogleResponse
    try {
      userInfo = await oauth2.userinfo.get()
    } catch (error) {
      this.logger.error(error)
      throw new BadRequestException(
        'Invalid Google OAuth2 access token or scopes.'
      )
    }
    return userInfo.data
  }
}
