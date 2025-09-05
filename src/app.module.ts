import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './users/users.module';
import { Config } from './config/index.config';
import { dotenvLoader, TypedConfigModule } from 'nest-typed-config';
import { ImagesModule } from './images/images.module';

@Module({
  imports: [
    UsersModule,
    TypedConfigModule.forRoot({
      schema: Config,
      load: dotenvLoader(),
    }),
    ImagesModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
