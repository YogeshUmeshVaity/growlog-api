export const signUpWithCorrectInfo = {
  username: 'test1',
  email: 'test1@test.com',
  password: 'test123&',
  confirmPassword: 'test123&'
}

export const signUpWithUsernameTwoChars = {
  username: 'te',
  email: 'test1@test.com',
  password: 'test123&',
  confirmPassword: 'test123&'
}

export const signUpWithAlreadyExistingName = {
  username: 'test1',
  email: 'testUnique@test.com',
  password: 'test123&',
  confirmPassword: 'test123&'
}

export const signUpWithInvalidEmail = {
  username: 'test2',
  email: 'test2@test',
  password: 'test123&',
  confirmPassword: 'test123&'
}

export const signUpWithAlreadyExistingEmail = {
  username: 'testUnique',
  email: 'test1@test.com',
  password: 'test123&',
  confirmPassword: 'test123&'
}

export const signUpWithPasswordSevenChars = {
  username: 'test2',
  email: 'test2@test.com',
  password: 't123&',
  confirmPassword: 't123&'
}

export const signUpWithPasswordWithoutSpecialChars = {
  username: 'test2',
  email: 'test2@test.com',
  password: 'testtest1',
  confirmPassword: 'testtest1'
}

export const signUpWithPasswordWithoutDigit = {
  username: 'test2',
  email: 'test2@test.com',
  password: 'testtest&',
  confirmPassword: 'testtest&'
}

export const signUpWithConfirmPasswordNoMatch = {
  username: 'test2',
  email: 'test2@test.com',
  password: 'testtest1&',
  confirmPassword: 'testtest&'
}
