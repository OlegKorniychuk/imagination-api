import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Config } from './config/index.config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('api/v1');
  const { PORT } = app.get(Config);

  await app.listen(PORT);
}
bootstrap().catch((err) => {
  throw err;
});
