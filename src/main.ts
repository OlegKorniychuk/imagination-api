import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Config } from './config/index.config';
import { ValidationPipe } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  app.setGlobalPrefix('api/v1');
  app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true }));
  app.set('query parser', 'extended');

  const config = new DocumentBuilder()
    .setTitle('Imagination API')
    .setDescription('API documentationi for Imagination image sharing app')
    .setVersion('1.0')
    .addTag('imagination')
    .addBearerAuth()
    .build();
  const documentFactory = () =>
    SwaggerModule.createDocument(app, config, { ignoreGlobalPrefix: false });
  SwaggerModule.setup('api/docs', app, documentFactory);

  const { PORT } = app.get(Config);
  await app.listen(PORT);
}
bootstrap().catch((err) => {
  throw err;
});
