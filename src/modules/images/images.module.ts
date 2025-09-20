import { Module } from '@nestjs/common';
import { ImagesService } from './images.service';
import { ImagesController } from './images.controller';
import { DrizzleModule } from 'src/modules/drizzle/drizzle.module';
import { S3Module } from 'src/modules/s3/s3.module';

@Module({
  controllers: [ImagesController],
  providers: [ImagesService],
  imports: [DrizzleModule, S3Module],
  exports: [ImagesService],
})
export class ImagesModule {}
