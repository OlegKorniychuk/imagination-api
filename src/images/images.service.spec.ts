import { Test, TestingModule } from '@nestjs/testing';
import { ImagesService } from './images.service';
import { S3Service } from 'src/s3/s3.service';
import { DRIZZLE } from 'src/drizzle/drizzle.module';
import { CreateImageDto } from './dto/create-image.dto';
import { Image } from './entities/image.entity';
import { images } from 'src/drizzle/schema/images.schema';
import { HttpException, HttpStatus } from '@nestjs/common';
import { UpdateImageDto } from './dto/update-image.dto';
import { MockDrizzleDB } from 'test/mocks/drizzle.mock';

const mockImage: Image = {
  id: 'a-valid-uuid',
  authorId: 'a-valid-uuid',
  uniqueName: 'a-unique-name',
  title: 'A beautiful sunset',
  description: null,
  tags: [],
  createdAt: new Date(),
  updatedAt: new Date(),
};

const mockS3ImageUrl = 'https://s3.signed.url/a-unique-name';

const mockS3Service = {
  uploadImage: jest.fn(),
  getImageUrl: jest.fn(),
  deleteImage: jest.fn(),
};

describe('ImagesService', () => {
  let service: ImagesService;
  let mockDrizzleDB: MockDrizzleDB;

  beforeEach(async () => {
    mockDrizzleDB = new MockDrizzleDB();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ImagesService,
        {
          provide: S3Service,
          useValue: mockS3Service,
        },
        {
          provide: DRIZZLE,
          useValue: mockDrizzleDB,
        },
      ],
    }).compile();

    service = module.get<ImagesService>(ImagesService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create an image record and upload it to S3', async () => {
      const createImageDto: CreateImageDto = {
        title: mockImage.title,
        authorId: mockImage.authorId,
      };
      const imageFile = { buffer: Buffer.from('test') } as Express.Multer.File;

      mockDrizzleDB.returning.mockResolvedValue([mockImage]);
      mockS3Service.uploadImage.mockResolvedValue(undefined);

      const result = await service.create(createImageDto, imageFile);

      expect(mockDrizzleDB.insert).toHaveBeenCalledWith(images);
      expect(mockDrizzleDB.values).toHaveBeenLastCalledWith(
        expect.objectContaining(createImageDto),
      );
      expect(mockS3Service.uploadImage).toHaveBeenCalledWith(
        imageFile,
        expect.any(String),
      );
      expect(result).toEqual(mockImage);
    });

    it('should delete image from db if S3 upload failes', async () => {
      const createImageDto: CreateImageDto = {
        title: mockImage.title,
        authorId: mockImage.authorId,
      };
      const imageFile = { buffer: Buffer.from('test') } as Express.Multer.File;
      const uploadError = new Error('upload failed');

      mockDrizzleDB.returning.mockResolvedValue([mockImage]);
      mockS3Service.uploadImage.mockRejectedValue(uploadError);

      await expect(service.create(createImageDto, imageFile)).rejects.toThrow(
        new HttpException(
          'Failed to save image',
          HttpStatus.INTERNAL_SERVER_ERROR,
        ),
      );

      expect(mockDrizzleDB.delete).toHaveBeenCalledWith(images);
      expect(mockDrizzleDB.where).toHaveBeenCalledWith(expect.anything());
    });
  });

  describe('findAll', () => {
    it('should return all images with signed urls', async () => {
      mockDrizzleDB.from.mockResolvedValue([mockImage, mockImage]);
      mockS3Service.getImageUrl.mockResolvedValue(mockS3ImageUrl);

      const result = await service.findAll();

      expect(mockDrizzleDB.select).toHaveBeenCalled();
      expect(mockDrizzleDB.from).toHaveBeenCalledWith(images);
      expect(mockS3Service.getImageUrl).toHaveBeenCalled();
      expect(result.length).toBe(2);
      result.forEach((image) => {
        expect(image).toEqual({ ...mockImage, url: mockS3ImageUrl });
      });
    });
  });

  describe('findOne', () => {
    it('should return an image with signed url', async () => {
      mockDrizzleDB.where.mockResolvedValue([mockImage]);
      mockS3Service.getImageUrl.mockResolvedValue(mockS3ImageUrl);

      const result = await service.findOne(mockImage.id);

      expect(mockDrizzleDB.select).toHaveBeenCalled();
      expect(mockDrizzleDB.from).toHaveBeenCalledWith(images);
      expect(mockDrizzleDB.where).toHaveBeenCalledWith(expect.anything());
      expect(mockS3Service.getImageUrl).toHaveBeenCalled();
      expect(result).toEqual({ ...mockImage, url: mockS3ImageUrl });
    });

    it('should throw an error if this id does not exist', async () => {
      mockDrizzleDB.where.mockResolvedValue([]);

      await expect(service.findOne(mockImage.id)).rejects.toEqual(
        new HttpException('Incorrect ID', HttpStatus.BAD_REQUEST),
      );

      expect(mockDrizzleDB.select).toHaveBeenCalled();
      expect(mockDrizzleDB.from).toHaveBeenCalledWith(images);
    });
  });

  describe('update', () => {
    it('should update an image record and return it', async () => {
      const mockUpdateData: UpdateImageDto = { title: 'new title' };
      mockDrizzleDB.returning.mockResolvedValue([mockImage]);

      const result = await service.update(mockImage.id, mockUpdateData);

      expect(mockDrizzleDB.update).toHaveBeenCalledWith(images);
      expect(mockDrizzleDB.set).toHaveBeenCalledWith(mockUpdateData);
      expect(result).toEqual(mockImage);
    });

    it('should throw an error if this id does not exist', async () => {
      const mockUpdateData: UpdateImageDto = { title: 'new title' };
      mockDrizzleDB.returning.mockResolvedValue([]);

      await expect(
        service.update(mockImage.id, mockUpdateData),
      ).rejects.toEqual(
        new HttpException('Incorrect ID', HttpStatus.BAD_REQUEST),
      );

      expect(mockDrizzleDB.update).toHaveBeenCalledWith(images);
    });
  });

  describe('remove', () => {
    it('should delete an image from S3 and its record from DB', async () => {
      mockDrizzleDB.returning.mockResolvedValue([mockImage]);

      const result = await service.remove(mockImage.id);

      expect(mockDrizzleDB.delete).toHaveBeenCalledWith(images);
      expect(mockS3Service.deleteImage).toHaveBeenCalledWith(
        mockImage.uniqueName,
      );
      expect(result).toEqual(mockImage);
    });

    it('should throw an error if this id does not exist', async () => {
      mockDrizzleDB.returning.mockResolvedValue([]);

      await expect(service.remove(mockImage.id)).rejects.toEqual(
        new HttpException('Incorrect ID', HttpStatus.BAD_REQUEST),
      );

      expect(mockDrizzleDB.delete).toHaveBeenCalledWith(images);
    });
  });
});
