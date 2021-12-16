import { getConnection } from 'typeorm'
import { Response } from 'supertest'

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

/**
 * Utility function that extracts the first error message from the Supertest response object.
 * @param response object from Supertest.
 * @returns jest.JestMatchers<any>
 */
export const expectMessageFrom = (response: Response) => {
  const message = response.body.message
  if (message instanceof Array) {
    return expect(message[0])
  } else {
    return expect(message)
  }
}
