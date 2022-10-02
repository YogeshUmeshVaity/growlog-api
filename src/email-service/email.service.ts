import { EmailMessage } from '../users/dtos/email-message.dto'
import { Injectable, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { ServerClient } from 'postmark'

/**
 * Sends emails using the Postmark email provider.
 */
@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name)
  private emailClient: ServerClient
  constructor(private readonly configService: ConfigService) {
    this.emailClient = new ServerClient(
      this.configService.get<string>('POSTMARK_SERVER_TOKEN')
    )
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
