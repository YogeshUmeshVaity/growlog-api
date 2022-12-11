import { Module, ValidationPipe } from '@nestjs/common'
import { ConfigModule, ConfigService } from '@nestjs/config'
import { TypeOrmModule } from '@nestjs/typeorm'
import { AppController } from './app.controller'
import { AppService } from './app.service'
import { User } from './users/user.entity'
import { UsersModule } from './users/users.module'
import { AuthModule } from './auth/auth.module'
import { APP_PIPE } from '@nestjs/core'
import { PasswordRecovery } from './password-recovery/password-recovery.entity'
import { PasswordRecoveryModule } from './password-recovery/password-recovery.module'
import { EmailServiceModule } from './email-service/email-service.module'
import { EnvConfigModule } from './env-config/env-config.module'
import { validateEnvs } from './env-config/env-validator'

/**
 * The forRoot() method registers the ConfigService provider. During this step, environment variable
 * key/value pairs are parsed and resolved.
 *
 * isGlobal: true; so we don't have to import this module in every module.
 * cache: true; improves performance of accessing the envs.
 *
 * TODO: Check if Nest prevents app start up, if env vars are absent. If not, implement it with
 * the require() method.
 * https://docs.nestjs.com/techniques/configuration#schema-validation
 *
 * TODO: Consider using getter functions for envs. Possibly with a separate module called 'config'.
 * https://docs.nestjs.com/techniques/configuration#custom-getter-functions
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
  // Injects the dependency required by the useFactory.
  inject: [ConfigService],
  // Creates a TypeOrmModuleAsyncOptions object.
  useFactory: (config: ConfigService) => {
    return {
      type: 'postgres',
      host: config.get<string>('POSTGRES_HOST'),
      port: config.get<number>('POSTGRES_PORT'),
      database: config.get<string>('POSTGRES_DATABASE_NAME'),
      username: config.get<string>('POSTGRES_USER_NAME'),
      password: config.get<string>('POSTGRES_PASSWORD'),
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
  controllers: [AppController],
  providers: [AppService, globalValidationPipe]
})
export class AppModule {}
