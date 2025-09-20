import { Test, TestingModule } from '@nestjs/testing';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { MockDrizzleDB } from 'test/mocks/drizzle.mock';
import { DRIZZLE } from 'src/modules/drizzle/drizzle.module';
import { ImagesService } from 'src/modules/images/images.service';
import { S3Service } from 'src/modules/s3/s3.service';

describe('UsersController', () => {
  let controller: UsersController;
  let mockDrizzleDB: MockDrizzleDB;

  beforeEach(async () => {
    mockDrizzleDB = new MockDrizzleDB();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        UsersService,
        { provide: DRIZZLE, useValue: mockDrizzleDB },
        { provide: ImagesService, useValue: {} },
        { provide: S3Service, useValue: {} },
      ],
    }).compile();

    controller = module.get<UsersController>(UsersController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
