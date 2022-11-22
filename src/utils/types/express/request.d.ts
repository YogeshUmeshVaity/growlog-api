import { User } from '../../../users/user.entity'

/**
 * This file must be in the ./types/express directory of the project. The reason is that you can
 * either create a directory named express or having a file named express.d.ts to tell typescript
 * that you are aiming this specific module (which is installed through express type definitions).
 * Augments existing definition of Request in Express.
 */
declare global {
  declare namespace Express {
    export interface Request {
      user?: User
    }
  }
}
