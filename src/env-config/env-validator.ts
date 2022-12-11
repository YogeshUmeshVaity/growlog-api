import { plainToInstance } from 'class-transformer'
import {
  IsEmail,
  IsEnum,
  IsIP,
  IsNotEmpty,
  IsNumber,
  IsPort,
  IsString,
  IsUrl,
  validateSync
} from 'class-validator'

enum Environment {
  Development = 'development',
  Production = 'production',
  Test = 'test'
}

class EnvironmentVariables {
  /**
   * States whether the current environment is development, test or production. This is not defined
   * in the .env files. This is set through the package.json scripts, depending on whether you run
   * 'yarn test', 'yarn start:dev' and so on.
   */
  @IsEnum(Environment)
  NODE_ENV: Environment

  /**
   * App's server port number. The class-validator package requires @IsPort()
   * property to be typed as a 'string' instead of 'number' for the validation to work correctly.
   * This maybe fixed in the future: https://github.com/typestack/class-validator/issues/826#issue-755304908
   */
  @IsPort()
  PORT: string

  /**
   * Company details.
   */
  @IsString()
  @IsNotEmpty()
  COMPANY_NAME: string

  /**
   * App URL.
   */
  @IsUrl({
    require_tld: false // for allowing localhost urls
  })
  BASE_URL: string

  /**
   * The company email from which you send the emails to users.
   * For example, Password Recovery 'from' Email.
   */
  @IsEmail()
  FROM_EMAIL: string

  /**
   * For sending emails to users from Postmark email service
   */
  @IsString()
  @IsNotEmpty()
  POSTMARK_SERVER_TOKEN: string

  /**
   * Password Recovery code expiry in minutes.
   */
  @IsNumber()
  RECOVERY_CODE_EXPIRY_MINUTES: number

  /**
   * IP address of the host that runs our Postgres database server.
   */
  @IsIP()
  POSTGRES_HOST: string

  /**
   * Port number of the Postgres database server. The class-validator package requires @IsPort()
   * property to be typed as a 'string' instead of 'number' for the validation to work correctly.
   * This maybe fixed in the future: https://github.com/typestack/class-validator/issues/826#issue-755304908
   */
  @IsPort()
  POSTGRES_PORT: string

  /**
   * Username of the Postgres database server.
   */
  @IsString()
  @IsNotEmpty()
  POSTGRES_USER_NAME: string

  /**
   * Password of the Postgres database server.
   */
  @IsString()
  @IsNotEmpty()
  POSTGRES_PASSWORD: string

  /**
   * Name of the specific database on our database server.
   */
  @IsString()
  @IsNotEmpty()
  POSTGRES_DATABASE_NAME: string
}

/**
 * Throws errors at the start of the application, if required environment variables haven't been
 * provided or if they don't meet the specified validation rules.
 * @param config is an object with key-value pairs of environment variables and their values. This
 * provided by the Nest when it calls the ConfigModule.forRoot({}).
 * @returns the validated instance of EnvironmentVariables.
 */
export function validateEnvs(config: Record<string, unknown>) {
  const validatedConfig = plainToInstance(EnvironmentVariables, config, {
    enableImplicitConversion: true
  })
  const errors = validateSync(validatedConfig, { skipMissingProperties: false })

  if (errors.length > 0) {
    throw new Error(errors.toString())
  }
  return validatedConfig
}
