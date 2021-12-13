import { Module } from '@nestjs/common'
import { ConfigModule, ConfigService } from '@nestjs/config'
import { TypeOrmModule } from '@nestjs/typeorm'
import { AppController } from './app.controller'
import { AppService } from './app.service'
import { User } from './users/user.entity'
import { UsersModule } from './users/users.module'

/**
 * The forRoot() method registers the ConfigService provider. During this step, environment variable
 * key/value pairs are parsed and resolved.
 *
 * isGlobal: true; so that we don't have to import this module in every module.
 * cache: true; improves performance of accessing the envs.
 */

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: `.env.${process.env.NODE_ENV}`,
      cache: true,
    }),
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
          entities: [User],
        }
      },
    }),
    UsersModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
