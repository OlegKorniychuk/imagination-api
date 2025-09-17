import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Config } from './config/index.config';
import { ValidationPipe } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  app.setGlobalPrefix('api/v1');
  app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true }));
  app.set('query parser', 'extended');

  const { PORT } = app.get(Config);
  await app.listen(PORT);
}
bootstrap().catch((err) => {
  throw err;
});
