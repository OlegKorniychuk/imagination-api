import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { User } from 'src/users/entities/user.entity';
import { UsersService } from 'src/users/users.service';
import { JwtService } from '@nestjs/jwt';
import { compare } from 'bcrypt';
import { Config } from 'src/config/index.config';
import { MockConfig } from 'test/mocks/config.mock';

jest.mock('bcrypt');

const mockUser: User = {
  id: 'user-uuid-123',
  username: 'testUser',
  email: 'test@example.com',
  password: 'hashedPassword123',
  createdAt: new Date(),
  updatedAt: new Date(),
};

const mockAccessToken = 'mock.jwt.token.string';

describe('AuthService', () => {
  let service: AuthService;
  let mockConfig: MockConfig;

  const mockUsersService = {
    findByEmail: jest.fn(),
  };

  const mockJwtService = {
    sign: jest.fn(),
  };

  beforeEach(async () => {
    mockConfig = new MockConfig();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useValue: mockUsersService },
        { provide: JwtService, useValue: mockJwtService },
        { provide: Config, useValue: mockConfig },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('validateUser', () => {
    it('should return a user when credentials are valid', async () => {
      mockUsersService.findByEmail.mockResolvedValue(mockUser);
      (compare as jest.Mock).mockResolvedValue(true);

      const result = await service.validateUser(
        'test@example.com',
        'password123',
      );

      expect(mockUsersService.findByEmail).toHaveBeenCalledWith(
        'test@example.com',
      );
      expect(compare).toHaveBeenCalledWith('password123', mockUser.password);
      expect(result).toEqual(mockUser);
    });

    it('should return null if the user is not found', async () => {
      mockUsersService.findByEmail.mockResolvedValue(undefined);

      const result = await service.validateUser(
        'notfound@example.com',
        'password123',
      );

      expect(result).toBeNull();
      expect(compare).not.toHaveBeenCalled();
    });

    it('should return null if the password does not match', async () => {
      mockUsersService.findByEmail.mockResolvedValue(mockUser);
      (compare as jest.Mock).mockResolvedValue(false);

      const result = await service.validateUser(
        'test@example.com',
        'wrongpassword',
      );

      expect(result).toBeNull();
      expect(compare).toHaveBeenCalledWith('wrongpassword', mockUser.password);
    });
  });

  describe('login', () => {
    it('should sign and return access and refresh tokens', () => {
      mockJwtService.sign.mockReturnValue(mockAccessToken);
      const expectedPayload = {
        email: mockUser.email,
        sub: mockUser.id,
      };

      const result = service.login(mockUser);

      expect(mockJwtService.sign).toHaveBeenCalledTimes(2);
      expect(mockJwtService.sign).toHaveBeenCalledWith(expectedPayload, {
        expiresIn: mockConfig.ACCESS_TOKEN_EXPIRES_IN,
        secret: mockConfig.ACCESS_TOKEN_SECRET,
      });
      expect(mockJwtService.sign).toHaveBeenCalledWith(expectedPayload, {
        expiresIn: mockConfig.REFRESH_TOKEN_EXPIRES_IN,
        secret: mockConfig.REFRESH_TOKEN_SECRET,
      });
      expect(result).toEqual({
        accessToken: mockAccessToken,
        refreshToken: mockAccessToken,
      });
    });
  });
});
