import { INestApplication } from '@nestjs/common'
import { EmailService } from '../../../src/email-service/email.service'
import { EmailMessage } from '../../../src/users/dtos/email-message.dto'

/**
 * Spies on the sendEmail() method of the EmailService class to be able to read email messages.
 * @param app is an instance of INestApplication created using the TestingModule.
 * @returns the spy of sendEmail() of EmailService.
 */
export async function spyOnEmailService(app: INestApplication) {
  const emailService = await app.resolve(EmailService)
  const emailSpy = jest.spyOn(emailService, 'sendEmail')
  return emailSpy
}

/**
 * Retrieves the recovery code from the sent email.
 * @param emailSpy is the spy of sendEmail() of EmailService.
 * @returns the recovery code.
 */
export function getRecoveryCodeFrom(
  emailSpy: jest.SpyInstance<Promise<void>, [message: EmailMessage]>
) {
  const emailMessage = getEmailMessageFrom(emailSpy)
  const recoveryCode = searchRecoveryCodeIn(emailMessage)
  reset(emailSpy)
  return recoveryCode
}

/**
 * Resets the emailSpy. We need to reset the spy once we use the value from mock.calls[0][0]. This
 * ensures that it won't be the same value on the next call of the spied function. It stores the
 * new object instead of the cached old object.
 */
function reset(
  emailSpy: jest.SpyInstance<Promise<void>, [message: EmailMessage]>
) {
  emailSpy.mockClear()
}

function searchRecoveryCodeIn(emailMessage: EmailMessage) {
  const emailBody = emailMessage.body
  const codePosition = emailBody.search('Recovery code: ')
  const recoveryCode = emailBody.substring(codePosition + 15, 84)
  return recoveryCode
}

function getEmailMessageFrom(
  emailSpy: jest.SpyInstance<Promise<void>, [message: EmailMessage]>
) {
  // get the argument(email) that sendEmail() method was called with.
  return emailSpy.mock.calls[0][0]
}
