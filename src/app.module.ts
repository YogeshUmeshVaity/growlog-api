import { Module, ValidationPipe } from '@nestjs/common'
import { ConfigModule, ConfigService } from '@nestjs/config'
import { TypeOrmModule } from '@nestjs/typeorm'
import { AppController } from './app.controller'
import { AppService } from './app.service'
import { User } from './users/user.entity'
import { UsersModule } from './users/users.module'
import { AuthModule } from './auth/auth.module'
import { APP_PIPE } from '@nestjs/core'

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

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: `.env.${process.env.NODE_ENV}`,
      cache: true
    }),
    // A dynamic module responsible for establishing a connection to the database.
    // This way we don't need to get a connection to the database in our repositories.
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        return {
          type: 'postgres',
          host: config.get<string>('POSTGRES_HOST'),
          port: config.get<number>('POSTGRES_PORT'), // Note the 'number'.
          database: config.get<string>('POSTGRES_DATABASE_NAME'),
          username: config.get<string>('POSTGRES_USER_NAME'),
          password: config.get<string>('POSTGRES_PASSWORD'),
          synchronize: true, // TODO: Disable this forever once the app goes in production.
          entities: [User]
        }
      }
    }),
    UsersModule,
    AuthModule
  ],
  controllers: [AppController],
  providers: [
    AppService,
    // Validates the body parameters using the class specified with class-validator package.
    // The pipe is global regardless of the module you specify in. Specify it in a module where its
    // class is defined.
    { provide: APP_PIPE, useValue: new ValidationPipe({ whitelist: true }) }
  ]
})
export class AppModule {}
