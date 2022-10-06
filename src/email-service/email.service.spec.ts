import { Test, TestingModule } from '@nestjs/testing'
import { configServiceMock } from '../../test/common-mocks/config-service.mock'
import { EmailService } from '../email-service/email.service'

/**
 * We declare an unassigned var and then initialize the variable inside the mocking function.
 * The jest.mock function is hoisted to the top level, so we need to use 'var' instead of 'let' or
 * 'const' because the var is hoisted to the top as well. We can access that while asserting.
 *
 * This situation occurred because the ServerClient property in postmark package is readonly. So we
 * cannot assign postmark.ServerClient = jest.fn().mockReturnValue({...}) inside our test.
 */
// eslint-disable-next-line no-var
var sendEmailOfServerClient: jest.Mock

jest.mock('postmark', () => {
  sendEmailOfServerClient = jest.fn().mockResolvedValue({})
  return {
    // This is how to mock a constructor
    ServerClient: jest.fn().mockReturnValue({
      // and this is how to mock a function for the object of that constructor
      sendEmail: sendEmailOfServerClient
    })
  }
})

describe('EmailService', () => {
  let emailService: EmailService

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [EmailService, configServiceMock()]
    }).compile()

    emailService = module.get<EmailService>(EmailService)
  })

  it('should be defined', () => {
    expect(emailService).toBeDefined()
  })

  describe(`sendEmail`, () => {
    it(`should send an email.`, async () => {
      await emailService.sendEmail({
        fromEmail: 'someone@gmail.com',
        toEmail: 'someone-else@gmail.com',
        subject: 'About something',
        body: 'A more detailed text about something'
      })
      expect(sendEmailOfServerClient).toBeCalled()
    })
  })
})
