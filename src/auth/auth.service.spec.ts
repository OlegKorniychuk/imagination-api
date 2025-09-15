import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { MockAuthService } from 'test/mocks/auth.mock';

describe('AuthService', () => {
  let service: AuthService;
  let mockAuthService: MockAuthService;

  beforeEach(async () => {
    mockAuthService = new MockAuthService();

    const module: TestingModule = await Test.createTestingModule({
      providers: [{ provide: AuthService, useValue: mockAuthService }],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
