import { NestFactory } from '@nestjs/core'
import { AppModule } from './app.module'

/**
 * Starting with the AppModule (root module), Nest assembles the dependency graph and begins the
 * process of Dependency Injection and instantiates the classes needed to launch our application.
 *
 * We use the catch() on the bootstrap() call to suppress the eslint rule no-floating-promises.
 */
async function bootstrap() {
  const app = await NestFactory.create(AppModule)
  await app.listen(3000)
}
bootstrap().catch((error) => console.error(error))
