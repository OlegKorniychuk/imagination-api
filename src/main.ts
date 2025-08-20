import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { EnvironmentalVariables } from './config/env';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const { PORT } = app.get(EnvironmentalVariables);

  await app.listen(PORT);
}
bootstrap();
