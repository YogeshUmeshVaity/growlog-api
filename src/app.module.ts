import { Module, ValidationPipe } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { APP_PIPE } from '@nestjs/core'
import { TypeOrmModule } from '@nestjs/typeorm'
import { AuthModule } from './auth/auth.module'
import { EmailServiceModule } from './email-service/email-service.module'
import { EnvConfigModule } from './env-config/env-config.module'
import { EnvConfigService } from './env-config/env-config.service'
import { validateEnvs } from './env-config/env-validator'
import { PasswordRecovery } from './password-recovery/password-recovery.entity'
import { PasswordRecoveryModule } from './password-recovery/password-recovery.module'
import { User } from './users/user.entity'
import { UsersModule } from './users/users.module'

/**
 * The forRoot() method registers the ConfigService provider. During this step, environment variable
 * key/value pairs are parsed and resolved.
 *
 * isGlobal: true; so we don't have to import this module in every module.
 * cache: true; improves performance of accessing the envs.
 */
const globalConfigModule = ConfigModule.forRoot({
  isGlobal: true,
  envFilePath: `.env.${process.env.NODE_ENV}`,
  cache: true,
  validate: validateEnvs
})

/**
 * Represents a dynamic module responsible for establishing a connection to the database.
 * This way we don't need to get a connection to the database in our repositories.
 * Very important TODO: make synchronize: false forever once the app goes in production.
 */
const typeOrmModule = TypeOrmModule.forRootAsync({
  // Need to import like this, if not using the global ConfigService.
  imports: [EnvConfigModule],
  // Injects the dependency required by the useFactory.
  inject: [EnvConfigService],
  // Creates a TypeOrmModuleAsyncOptions object.
  useFactory: (config: EnvConfigService) => {
    return {
      type: 'postgres',
      host: config.postgresHost,
      port: config.postgresPort,
      database: config.postgresDatabaseName,
      username: config.postgresUsername,
      password: config.postgresPassword,
      synchronize: true,
      entities: [User, PasswordRecovery]
    }
  }
})

/**
 * Validates the body parameters using the class specified with class-validator package.
 * The pipe is global regardless of the module you specify in. Specify it in a module where its
 * class is defined.
 *
 * whitelist: true acts as a security feature. It strips out the unwanted properties sent by client.
 */
const globalValidationPipe = {
  provide: APP_PIPE,
  useValue: new ValidationPipe({ whitelist: true, transform: true })
}

/**
 * This is our root module, Nest assembles the dependency graph by looking at the modules registered
 * here.
 */
@Module({
  imports: [
    globalConfigModule,
    typeOrmModule,
    UsersModule,
    AuthModule,
    PasswordRecoveryModule,
    EmailServiceModule,
    EnvConfigModule
  ],
  providers: [globalValidationPipe]
})
export class AppModule {}
