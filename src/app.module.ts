import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './users/users.module';
import { EnvironmentalVariables } from './config/env';
import { dotenvLoader, TypedConfigModule } from 'nest-typed-config';

@Module({
  imports: [
    UsersModule,
    TypedConfigModule.forRoot({
      schema: EnvironmentalVariables,
      load: dotenvLoader(),
    }),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
