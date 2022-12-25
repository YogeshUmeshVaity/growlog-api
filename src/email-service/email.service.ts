import { Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { ServerClient } from 'postmark'
import { EnvConfigService } from '../env-config/env-config.service'
import { EmailMessage } from '../users/dtos/email-message.dto'

/**
 * Sends emails using the Postmark email provider.
 */
@Injectable()
export class EmailService {
  private emailClient: ServerClient
  constructor(private readonly config: EnvConfigService) {
    this.emailClient = new ServerClient(this.config.postmarkServerToken)
  }

  async sendEmail(message: EmailMessage) {
    await this.emailClient.sendEmail({
      From: message.fromEmail,
      To: message.toEmail,
      Subject: message.subject,
      TextBody: message.body
    })
  }
}
