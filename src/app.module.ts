import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from 'src/modules/users/users.module';
import { Config } from './config/index.config';
import { dotenvLoader, TypedConfigModule } from 'nest-typed-config';
import { ImagesModule } from 'src/modules/images/images.module';
import { S3Module } from 'src/modules/s3/s3.module';
import { AuthModule } from 'src/modules/auth/auth.module';

@Module({
  imports: [
    UsersModule,
    TypedConfigModule.forRoot({
      schema: Config,
      load: dotenvLoader(),
    }),
    ImagesModule,
    S3Module,
    AuthModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
