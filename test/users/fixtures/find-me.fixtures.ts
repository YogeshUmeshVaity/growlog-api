import { User } from '../../../src/users/user.entity'

/**
 * @returns sample user object complying the User entity.
 */
export function sampleUser(): User {
  const user = new User()
  user.id = '30ff0b89-7a43-4892-9ccc-86bb5f16e296'
  user.username = 'abcabc123'
  user.email = 'abc@gmail.com'
  user.googleId = '111295779375838005922'
  user.renewTokenInvalidator()
  return user
}
