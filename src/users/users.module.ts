import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { DrizzleModule } from 'src/drizzle/drizzle.module';
import { ImagesModule } from 'src/images/images.module';
import { S3Module } from 'src/s3/s3.module';

@Module({
  controllers: [UsersController],
  providers: [UsersService],
  imports: [DrizzleModule, ImagesModule, S3Module],
  exports: [UsersService],
})
export class UsersModule {}
