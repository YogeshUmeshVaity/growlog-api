import { getConnection } from 'typeorm'

/**
 * Clears the database by synchronizing.
 * More ideas: https://github.com/nestjs/nest/issues/409#issue-295989413
 */
export const clearDb = async () => {
  if (process.env.NODE_ENV !== 'test') {
    throw new Error('This function can only be used in tests.')
  }
  // Here the true is for `dropBeforeSync`
  try {
    await getConnection().synchronize(true)
  } catch (err) {
    throw new Error('Unable to clear the database.')
  }
}
