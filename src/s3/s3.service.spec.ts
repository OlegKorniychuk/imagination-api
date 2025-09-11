import { Test, TestingModule } from '@nestjs/testing';
import { S3Service } from './s3.service';
import { Config } from 'src/config/index.config';
import {
  DeleteObjectCommand,
  GetObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

jest.mock('@aws-sdk/s3-request-presigner', () => ({
  getSignedUrl: jest.fn(),
}));

describe('S3 Service', () => {
  let service: S3Service;
  const mockSend = jest.fn();

  const mockConfig: Config = {
    DATABASE_URL: 'postgres://test',
    PORT: '3500',
    S3_BUCKET_NAME: 'test-bucket',
    S3_BUCKET_REGION: 'us-east-1',
    S3_BUCKET_KEY: 'test-key',
    S3_BUCKET_SECRET: 'test-secret',
  };

  const mockS3Client = { send: mockSend } as unknown as S3Client;

  beforeEach(async () => {
    mockSend.mockReset();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        S3Service,
        { provide: Config, useValue: mockConfig },
        { provide: S3Client, useValue: mockS3Client },
      ],
    }).compile();

    service = module.get<S3Service>(S3Service);
  });

  it('should upload an image', async () => {
    const file = {
      buffer: Buffer.from('test'),
      mimetype: 'image/png',
    } as Express.Multer.File;
    await service.uploadImage(file, 'unique-name');
    expect(mockSend).toHaveBeenCalled();
  });

  it('should delete an image', async () => {
    await service.deleteImage('unique-name');
    expect(mockSend).toHaveBeenCalledWith(expect.any(DeleteObjectCommand));
  });

  it('should return a signed url for an image', async () => {
    (getSignedUrl as jest.Mock).mockResolvedValue('https://signed-url');

    const url = await service.getImageUrl('unique-name', 3600);

    expect(getSignedUrl).toHaveBeenCalledWith(
      mockS3Client,
      expect.any(GetObjectCommand),
      { expiresIn: 3600 },
    );
    expect(url).toBe('https://signed-url');
  });
});
