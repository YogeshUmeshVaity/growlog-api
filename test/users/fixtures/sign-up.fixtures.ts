import { Token } from '../../../src/auth/dtos/token.dto'
import { SignUpDto } from '../../../src/users/dtos/signup-user.dto'

// Specifying annotating with SignUpDto will make them immutable because the field are readonly.
// This will prevent the tests from modifying them.
export const userWithCorrectInfo: SignUpDto = {
  username: 'test1',
  email: 'test1@test.com',
  password: 'test123&',
  confirmPassword: 'test123&'
}

export const userWithUsernameTwoChars: SignUpDto = {
  username: 'te',
  email: 'test1@test.com',
  password: 'test123&',
  confirmPassword: 'test123&'
}

export const userWithUsernameTwentyTwoChars: SignUpDto = {
  username: 'tessssssssssssssssst22',
  email: 'test1@test.com',
  password: 'test123&',
  confirmPassword: 'test123&'
}

export const userWithAlreadyExistingName: SignUpDto = {
  username: 'test1',
  email: 'testUnique@test.com',
  password: 'test123&',
  confirmPassword: 'test123&'
}

export const userWithInvalidEmail: SignUpDto = {
  username: 'test2',
  email: 'test2@test',
  password: 'test123&',
  confirmPassword: 'test123&'
}

export const userWithAlreadyExistingEmail: SignUpDto = {
  username: 'testUnique',
  email: 'test1@test.com',
  password: 'test123&',
  confirmPassword: 'test123&'
}

export const userWithPasswordSevenChars: SignUpDto = {
  username: 'test2',
  email: 'test2@test.com',
  password: 't123&',
  confirmPassword: 't123&'
}

export const userWithPasswordWithoutSpecialChars: SignUpDto = {
  username: 'test2',
  email: 'test2@test.com',
  password: 'testtest1',
  confirmPassword: 'testtest1'
}

export const userWithPasswordWithoutDigit: SignUpDto = {
  username: 'test2',
  email: 'test2@test.com',
  password: 'testtest&',
  confirmPassword: 'testtest&'
}

export const userWithConfirmPasswordNoMatch: SignUpDto = {
  username: 'test2',
  email: 'test2@test.com',
  password: 'testtest1&',
  confirmPassword: 'testtest&'
}

export const userWithSpaces: SignUpDto = {
  username: ' test1             ',
  email: ' test1@test.com       ',
  password: 'test123&',
  confirmPassword: 'test123&'
}

export const sampleToken: Token = { token: 'SomeBigTextJwtToken' }
