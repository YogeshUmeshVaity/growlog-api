import { validateEnvs } from './env-validator'
import 'reflect-metadata'

const validConfig = {
  NODE_ENV: 'test',
  PORT: '3000',
  COMPANY_NAME: 'Corporation',
  BASE_URL: 'http://localhost:8080',
  FROM_EMAIL: 'support@something.com',
  POSTMARK_SERVER_TOKEN: 'some-token-by-postmark',
  RECOVERY_CODE_EXPIRY_MINUTES: 120,
  POSTGRES_HOST: '127.0.0.1',
  POSTGRES_PORT: '4000',
  POSTGRES_USER_NAME: 'postgres-user',
  POSTGRES_PASSWORD: 'some-password',
  POSTGRES_DATABASE_NAME: 'your-database-name',
  JWT_SECRET: 'some-jwt-secret-text',
  JWT_EXPIRY: '1y',
  GOOGLE_OAUTH_CLIENT_ID: 'google-auth-client-id',
  GOOGLE_OAUTH_CLIENT_SECRET: 'google-auth-client-secret'
}

// Invalid RECOVERY_CODE_EXPIRY_MINUTES and PORT
const invalidConfig = {
  NODE_ENV: 'test',
  PORT: 3000,
  COMPANY_NAME: 'Corporation',
  BASE_URL: 'http://localhost:8080',
  FROM_EMAIL: 'support@something.com',
  POSTMARK_SERVER_TOKEN: 'some-token-by-postmark',
  RECOVERY_CODE_EXPIRY_MINUTES: 120,
  POSTGRES_HOST: '127.0.0.1',
  POSTGRES_PORT: '4000',
  POSTGRES_USER_NAME: 'postgres-user',
  POSTGRES_PASSWORD: 'some-password',
  POSTGRES_DATABASE_NAME: 'your-database-name',
  JWT_SECRET: 'some-jwt-secret-text',
  JWT_EXPIRY: '1y',
  GOOGLE_OAUTH_CLIENT_ID: 'google-auth-client-id',
  GOOGLE_OAUTH_CLIENT_SECRET: 'google-auth-client-secret'
}

describe('validateEnvs', () => {
  it('should return the validated ENVs when all the ENVs are valid.', () => {
    const validatedConfig = validateEnvs(validConfig)
    expect(validatedConfig).toMatchObject(validConfig)
  })

  it('should throw errors when any of the ENVs are invalid.', () => {
    expect.assertions(1)
    try {
      validateEnvs(invalidConfig)
    } catch (error) {
      expect(error.message).toContain(
        'An instance of EnvironmentVariables has failed the validation'
      )
    }
  })
})
