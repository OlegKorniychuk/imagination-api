import { Module } from '@nestjs/common';
import { ImagesService } from './images.service';
import { ImagesController } from './images.controller';
import { DrizzleModule } from 'src/drizzle/drizzle.module';

@Module({
  controllers: [ImagesController],
  providers: [ImagesService],
  imports: [DrizzleModule],
})
export class ImagesModule {}
