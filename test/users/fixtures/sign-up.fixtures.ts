import { SignUpDto } from '../../../src/users/dtos/signup-user.dto'

// Specifying annotating with SignUpDto will make them immutable because the field are readonly.
// This will prevent the tests from modifying them.
export const signUpWithCorrectInfo: SignUpDto = {
  username: 'test1',
  email: 'test1@test.com',
  password: 'test123&',
  confirmPassword: 'test123&'
}

export const signUpWithUsernameTwoChars: SignUpDto = {
  username: 'te',
  email: 'test1@test.com',
  password: 'test123&',
  confirmPassword: 'test123&'
}

export const signUpWithAlreadyExistingName: SignUpDto = {
  username: 'test1',
  email: 'testUnique@test.com',
  password: 'test123&',
  confirmPassword: 'test123&'
}

export const signUpWithInvalidEmail: SignUpDto = {
  username: 'test2',
  email: 'test2@test',
  password: 'test123&',
  confirmPassword: 'test123&'
}

export const signUpWithAlreadyExistingEmail: SignUpDto = {
  username: 'testUnique',
  email: 'test1@test.com',
  password: 'test123&',
  confirmPassword: 'test123&'
}

export const signUpWithPasswordSevenChars: SignUpDto = {
  username: 'test2',
  email: 'test2@test.com',
  password: 't123&',
  confirmPassword: 't123&'
}

export const signUpWithPasswordWithoutSpecialChars: SignUpDto = {
  username: 'test2',
  email: 'test2@test.com',
  password: 'testtest1',
  confirmPassword: 'testtest1'
}

export const signUpWithPasswordWithoutDigit: SignUpDto = {
  username: 'test2',
  email: 'test2@test.com',
  password: 'testtest&',
  confirmPassword: 'testtest&'
}

export const signUpWithConfirmPasswordNoMatch: SignUpDto = {
  username: 'test2',
  email: 'test2@test.com',
  password: 'testtest1&',
  confirmPassword: 'testtest&'
}
