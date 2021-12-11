import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm'

/**
 * Represents a currently logged in user in the app.
 */
@Entity({ name: 'users' })
export class User {
  /**
   * UserId: an autogenerated UUID.
   */
  @PrimaryGeneratedColumn('uuid')
  id: number

  /**
   * Username retrieved from local sign up or from the social login.
   */
  @Column()
  username: string

  /**
   * User's email retrieved from local sign up or from the social login.
   */
  @Column({ unique: true })
  email: string

  /**
   * User's hashed password along with the random hashed salt separated by a dot. The hashed salt
   * helps prevent Rainbow Table Attack. This field is optional, if the user is logged in using
   * the OpenID.
   */
  @Column({ nullable: true })
  hashedPassword?: string

  /**
   * UserId retrieved from Google's OpenID feature, if the user has logged in using Google.
   */
  @Column({ nullable: true })
  googleId?: string

  /**
   * UserId retrieved from facebook's OpenID feature, if the user has logged in using Facebook.
   */
  @Column({ nullable: true })
  facebookId?: string

  /**
   * UserId retrieved from Apple's OpenID feature, if the user has logged in using Apple.
   */
  @Column({ nullable: true })
  appleId?: string

  /**
   * A random string to join with the JWT secret key. Used for invalidating the current JWT tokens
   * with which the user is currently logged in from various devices. Changing this causes the
   * change in the JWT secret key with which the tokens were created. As a result the tokens stored
   * on all those devices become invalid. Helpful for logging out the user from all other devices.
   */
  @Column()
  tokenInvalidator: string

  /**
   * Date and time when the user was created. It is set automatically when the new user is inserted.
   */
  @CreateDateColumn()
  createdAt: Date

  /**
   * Date and time when the user was last updated. It is set automatically each time you call save()
   * function of the entity.
   */
  @UpdateDateColumn()
  updatedAt: Date
}
