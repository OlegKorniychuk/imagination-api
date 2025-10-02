import { Module } from '@nestjs/common';
import { SeedService } from './seed.service';
import { UsersModule } from '../users/users.module';
import { ImagesModule } from '../images/images.module';
import { S3Module } from '../s3/s3.module';
import { dotenvLoader, TypedConfigModule } from 'nest-typed-config';
import { RootConfig } from 'src/config/index.config';

@Module({
  imports: [
    UsersModule,
    ImagesModule,
    S3Module,
    TypedConfigModule.forRoot({
      schema: RootConfig,
      load: [dotenvLoader({ separator: '__' })],
    }),
  ],
  providers: [SeedService],
})
export class SeedModule {}
