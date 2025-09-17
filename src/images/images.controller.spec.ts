import { Test, TestingModule } from '@nestjs/testing';
import { ImagesController } from './images.controller';
import { ImagesService } from './images.service';
import { CreateImageDto } from './dto/create-image.dto';
import { UpdateImageDto } from './dto/update-image.dto';
import { S3Service } from 'src/s3/s3.service';
import { Image, S3Image } from './entities/image.entity';
import { HttpException, HttpStatus, NotFoundException } from '@nestjs/common';

class MockImagesService {
  create = jest.fn();
  findMany = jest.fn();
  findOne = jest.fn();
  update = jest.fn();
  remove = jest.fn();
}

class MockS3Service {
  uploadImage = jest.fn();
  getImageUrl = jest.fn();
  deleteImage = jest.fn();
}

const mockSignedUrl = 'https://s3-bucket/a-unique-name';

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

const mockS3Image: S3Image = {
  ...mockImage,
  url: mockSignedUrl,
};

describe('ImagesController', () => {
  let controller: ImagesController;
  let mockImagesService: MockImagesService;
  let mockS3Service: MockS3Service;

  beforeEach(async () => {
    mockImagesService = new MockImagesService();
    mockS3Service = new MockS3Service();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ImagesController],
      providers: [
        { provide: ImagesService, useValue: mockImagesService },
        { provide: S3Service, useValue: mockS3Service },
      ],
    }).compile();

    controller = module.get<ImagesController>(ImagesController);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    const dto: CreateImageDto = { title: 'test', authorId: 'uuid' };
    const file = { buffer: Buffer.from('test') } as Express.Multer.File;

    it('should create an image record, upload to S3, and return the record with a signed URL', async () => {
      mockImagesService.create.mockResolvedValue(mockImage);
      mockS3Service.uploadImage.mockResolvedValue(undefined);
      mockS3Service.getImageUrl.mockResolvedValue(mockSignedUrl);

      const result = await controller.create(dto, file);

      expect(mockImagesService.create).toHaveBeenCalledWith(
        dto,
        expect.any(String),
      );
      expect(mockS3Service.uploadImage).toHaveBeenCalledWith(
        file,
        expect.any(String),
      );
      expect(mockS3Service.getImageUrl).toHaveBeenCalledWith(
        expect.any(String),
        3600,
      );
      expect(result).toEqual(mockS3Image);
    });

    it('should roll back the DB create if S3 upload fails', async () => {
      const uploadError = new Error('S3 upload failed');
      mockImagesService.create.mockResolvedValue(mockImage);
      mockS3Service.uploadImage.mockRejectedValue(uploadError);

      await expect(controller.create(dto, file)).rejects.toThrow(
        new HttpException(
          'Failed to save image',
          HttpStatus.INTERNAL_SERVER_ERROR,
        ),
      );

      expect(mockImagesService.remove).toHaveBeenCalledWith(mockImage.id);
    });
  });

  describe('findMany', () => {
    it('should return an array of images with their S3 URLs', async () => {
      const imagesArray = [mockImage, { ...mockImage, id: 'uuid-2' }];
      mockImagesService.findMany.mockResolvedValue(imagesArray);
      mockS3Service.getImageUrl.mockResolvedValue(mockSignedUrl);

      const result = await controller.findMany({});

      expect(mockImagesService.findMany).toHaveBeenCalledWith({});
      expect(mockS3Service.getImageUrl).toHaveBeenCalledTimes(
        imagesArray.length,
      );
      expect(result[0]).toHaveProperty('url', mockSignedUrl);
      expect(result.length).toBe(2);
    });
  });

  describe('findOne', () => {
    it('should return a single image record with its S3 URL', async () => {
      mockImagesService.findOne.mockResolvedValue(mockImage);
      mockS3Service.getImageUrl.mockResolvedValue(mockSignedUrl);

      const result = await controller.findOne(mockImage.id);

      expect(mockImagesService.findOne).toHaveBeenCalledWith(mockImage.id);
      expect(mockS3Service.getImageUrl).toHaveBeenCalledWith(
        mockImage.uniqueName,
        3600,
      );
      expect(result).toEqual(mockS3Image);
    });

    it('should throw NotFoundException if image is not found', async () => {
      mockImagesService.findOne.mockResolvedValue(null);

      await expect(controller.findOne('non-existent-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('update', () => {
    const dto: UpdateImageDto = { title: 'updated title' };

    it('should update an image and return the updated record', async () => {
      const updatedImage = { ...mockImage, ...dto };
      mockImagesService.update.mockResolvedValue(updatedImage);

      const result = await controller.update(mockImage.id, dto);

      expect(mockImagesService.update).toHaveBeenCalledWith(mockImage.id, dto);
      expect(result).toEqual(updatedImage);
    });

    it('should throw NotFoundException if image to update is not found', async () => {
      mockImagesService.update.mockResolvedValue(null);

      await expect(controller.update('non-existent-id', dto)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('remove', () => {
    it('should delete an image from the DB and S3', async () => {
      mockImagesService.remove.mockResolvedValue(mockImage);
      mockS3Service.deleteImage.mockResolvedValue(undefined);

      const result = await controller.remove(mockImage.id);

      expect(mockImagesService.remove).toHaveBeenCalledWith(mockImage.id);
      expect(mockS3Service.deleteImage).toHaveBeenCalledWith(
        mockImage.uniqueName,
      );
      expect(result).toBeUndefined();
    });

    it('should throw NotFoundException if image to delete is not found', async () => {
      mockImagesService.remove.mockResolvedValue(null);

      await expect(controller.remove('non-existent-id')).rejects.toThrow(
        NotFoundException,
      );
      expect(mockS3Service.deleteImage).not.toHaveBeenCalled();
    });

    it('should return even if S3 delete fails', async () => {
      const s3Error = new Error('S3 delete failed');
      mockImagesService.remove.mockResolvedValue(mockImage);
      mockS3Service.deleteImage.mockRejectedValue(s3Error);

      const result = await controller.remove(mockImage.id);

      expect(result).toBeUndefined();
      expect(mockS3Service.deleteImage).toHaveBeenCalledWith(
        mockImage.uniqueName,
      );
    });
  });
});
