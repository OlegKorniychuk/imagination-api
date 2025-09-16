import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { DrizzleModule } from 'src/drizzle/drizzle.module';
import { ImagesModule } from 'src/images/images.module';

@Module({
  controllers: [UsersController],
  providers: [UsersService],
  imports: [DrizzleModule, ImagesModule],
  exports: [UsersService],
})
export class UsersModule {}
