import { NestFactory, Reflector } from '@nestjs/core';
import { AppModule } from './app.module';
import { Config } from './config/index.config';
import {
  ClassSerializerInterceptor,
  INestApplication,
  ValidationPipe,
} from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

function registerGlobals(app: INestApplication) {
  app.setGlobalPrefix('api/v1');
  app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true }));
  app.useGlobalInterceptors(
    new ClassSerializerInterceptor(app.get(Reflector), {
      strategy: 'exposeAll',
    }),
  );
}

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  app.set('query parser', 'extended');
  registerGlobals(app);

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
