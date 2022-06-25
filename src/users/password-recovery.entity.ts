import { Column, Entity, OneToOne, PrimaryGeneratedColumn } from 'typeorm'
import { User } from './user.entity'

/**
 * Represents the recovery code used for resetting the password.
 */
@Entity()
export class PasswordRecovery {
  /**
   * RecoveryId: an autogenerated UUID.
   */
  @PrimaryGeneratedColumn('uuid')
  id: string

  /**
   * The code that is sent to user via email.
   */
  @Column()
  code: string

  /**
   * Date and time of the expiry of the code. The code is invalid if it exceeds the expiration.
   */
  @Column()
  expiration: Date

  /**
   * The user associate with this password-recovery.
   *
   * 'onDelete' sets the userId foreign key to CASCADE. This means that when the User is deleted,
   * the PasswordRecovery is also deleted.
   */
  @OneToOne(() => User, (user) => user.passwordRecovery, {
    onDelete: 'CASCADE'
  })
  user: User
}
