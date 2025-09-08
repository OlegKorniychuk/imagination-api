import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Config } from './config/index.config';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('api/v1');
  app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
  const { PORT } = app.get(Config);
  await app.listen(PORT);
}
bootstrap().catch((err) => {
  throw err;
});
