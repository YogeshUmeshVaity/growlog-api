export const userWithCorrectInfo = {
  username: 'test1',
  email: 'test1@test.com',
  password: 'test123&',
  confirmPassword: 'test123&'
}

export const userWithAlreadyExistingName = {
  username: 'test1',
  email: 'testUnique@test.com',
  password: 'test123&',
  confirmPassword: 'test123&'
}

export const userWithAlreadyExistingEmail = {
  username: 'testUnique',
  email: 'test1@test.com',
  password: 'test123&',
  confirmPassword: 'test123&'
}

export const userWithPasswordSevenChars = {
  username: 'test2',
  email: 'test2@test.com',
  password: 't123&',
  confirmPassword: 't123&'
}

export const userWithPasswordWithoutSpecialChars = {
  username: 'test2',
  email: 'test2@test.com',
  password: 'testtest1',
  confirmPassword: 'testtest1'
}

export const userWithPasswordWithoutDigit = {
  username: 'test2',
  email: 'test2@test.com',
  password: 'testtest&',
  confirmPassword: 'testtest&'
}

export const userWithConfirmPasswordNoMatch = {
  username: 'test2',
  email: 'test2@test.com',
  password: 'testtest1&',
  confirmPassword: 'testtest&'
}
