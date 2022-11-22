import {
  Column,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn
} from 'typeorm'
import { User } from '../users/user.entity'

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
   * The recovery code that is sent to user via email.
   */
  @Column({ unique: true })
  code: string

  /**
   * Date and time of the expiry of the code. The code is invalid if it exceeds the expiration.
   */
  @Column()
  expiration: Date

  /**
   * The user associate with this password-recovery.
   *
   * 'onDelete' means that when the User is deleted, the PasswordRecovery is also deleted.
   *
   * 'eager' will make sure that the find operation always includes the user object.
   *
   * We want to the userId field to be on the PasswordRecovery table, so we use @JoinColumn() on
   * this side instead of User. Because of this, we don't have to have the passwordRecoveryId on the
   * User table. As a result we don't have to delete the reference passwordRecoveryId when we delete
   * the PasswordRecovery. Without the @JoinColumn() decorator, onDelete: 'CASCADE' doesn't
   * work.
   */
  @OneToOne(() => User, (user) => user.passwordRecovery, {
    onDelete: 'CASCADE',
    eager: true
  })
  @JoinColumn()
  user: User
}
