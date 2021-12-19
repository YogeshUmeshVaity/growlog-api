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
export const messageFrom = (response: Response) => {
  const message = response.body.message
  if (message instanceof Array) {
    return message[0]
  } else {
    return message
  }
}

/**
 * Decodes the payload of JWT without using the secret.
 *
 * On the server side:
 * 1. JavaScript object with payload is converted to JSON string.
 * 2. JSON string is converted to binary data.
 *    Binary data cannot be sent in URL due to character conflicts.
 * 3. So, this binary data is encoded to Base64 string.
 *    Base64 string still contains conflicting characters like '+', '/'.
 * 4. So, this Base64 string is converted to Base64Url.
 *    In Base64Url format, '+' and '/' are replaced by '-' and '_' respectively.
 * 5. This Base64Url is what the content of the JWT, that is sent over the network.
 *
 * On the client side:
 * That is, in this function, the above process is reversed to get the JavaScript object from JWT.
 *
 * @param response from Supertest.
 * @returns JWT payload in JavaScript object.
 */
export const tokenFrom = (response: Response) => {
  const token: string = response.body.token

  // Take the middle part of the JWT. This is what contains the payload, like userId.
  const base64Url = token.split('.')[1]

  // Convert it to base64 by replacing all the + with - and all the / with _
  const base64 = base64Url.replace('-', '+').replace('_', '/')

  // Buffer in Node.js is used for reading and manipulating the streams of binary data.
  // By specifying the encoding, we tell it that the data is of type base64, So it creates the
  // appropriate representation of base64 into 8 bit sequence of binary bytes.
  const buffer = Buffer.from(base64, 'base64')

  // Convert the Buffer to a string. Because this payload is a JSON object(hence called JWT token),
  // the string we get here is in JSON format. This process is called decoding the buffer.
  const json = buffer.toString()

  // Convert the JSON string into the JavaScript object.
  const payload = JSON.parse(json)

  return payload
}
