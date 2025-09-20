import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './users.service';
import { MockDrizzleDB } from 'test/mocks/drizzle.mock';
import { DRIZZLE } from 'src/modules/drizzle/drizzle.module';

describe('UsersService', () => {
  let service: UsersService;
  let mockDrizzleDB: MockDrizzleDB;

  beforeEach(async () => {
    mockDrizzleDB = new MockDrizzleDB();

    const module: TestingModule = await Test.createTestingModule({
      providers: [UsersService, { provide: DRIZZLE, useValue: mockDrizzleDB }],
    }).compile();

    service = module.get<UsersService>(UsersService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
