import { Expose } from 'class-transformer'

/**
 * Used for sending a user object as a Response. It hides the sensitive properties such as password
 * and only exposes the specified properties.
 */
export class UserDto {
  @Expose()
  id: number

  @Expose()
  username: string

  @Expose()
  email: string
}
