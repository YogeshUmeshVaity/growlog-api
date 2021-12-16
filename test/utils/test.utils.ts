import { getConnection } from 'typeorm'
import { Response } from 'supertest'
import { response } from 'express'

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
export const messageFrom = (response: Response) => {
  const message = response.body.message
  if (message instanceof Array) {
    return message[0]
  } else {
    return message
  }
}

export const tokenFrom = (response: Response) => {
  const token = response.body.token
  const base64Url = token.split('.')[1] // token you get
  const base64 = base64Url.replace('-', '+').replace('_', '/')
  const decodedData = JSON.parse(
    Buffer.from(base64, 'base64').toString('binary')
  )
  return decodedData
}
