import { Test, TestingModule } from '@nestjs/testing';
import { ImagesController } from './images.controller';
import { ImagesService } from './images.service';
import { CreateImageDto } from './dto/create-image.dto';
import { UpdateImageDto } from './dto/update-image.dto';

class MockImagesService {
  create = jest.fn();
  findAll = jest.fn();
  findOne = jest.fn();
  update = jest.fn();
  remove = jest.fn();
}

// const mockImage: Image = {
//   id: 'a-valid-uuid',
//   authorId: 'a-valid-uuid',
//   uniqueName: 'a-unique-name',
//   title: 'A beautiful sunset',
//   description: null,
//   tags: [],
//   createdAt: new Date(),
//   updatedAt: new Date(),
// };

describe('ImagesController', () => {
  let controller: ImagesController;
  let mockImagesService: MockImagesService;

  beforeEach(async () => {
    mockImagesService = new MockImagesService();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ImagesController],
      providers: [{ provide: ImagesService, useValue: mockImagesService }],
    }).compile();

    controller = module.get<ImagesController>(ImagesController);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should call create an image', async () => {
      const dto: CreateImageDto = {
        title: 'test image',
        authorId: 'valid-uuid',
      };
      const file = { originalname: 'test.jpg' } as Express.Multer.File;
      const result = { id: '1', title: 'test image' };

      mockImagesService.create.mockResolvedValue(result);

      const response = await controller.create(dto, file);

      expect(mockImagesService.create).toHaveBeenCalledWith(dto, file);
      expect(response).toEqual(result);
    });
  });

  describe('findAll', () => {
    it('should return all images', async () => {
      const images = [{ id: '1', title: 'img1' }];
      mockImagesService.findAll.mockResolvedValue(images);

      const response = await controller.findAll();

      expect(mockImagesService.findAll).toHaveBeenCalled();
      expect(response).toEqual(images);
    });
  });

  describe('findOne', () => {
    it('should return a single image by id', async () => {
      const id = '1';
      const image = { id: '1', title: 'img1' };
      mockImagesService.findOne.mockResolvedValue(image);

      const response = await controller.findOne(id);

      expect(mockImagesService.findOne).toHaveBeenCalledWith(id);
      expect(response).toEqual(image);
    });
  });

  describe('update', () => {
    it('should update image by id', async () => {
      const id = '1';
      const dto: UpdateImageDto = { title: 'updated' };
      const updated = { id: '1', title: 'updated' };
      mockImagesService.update.mockResolvedValue(updated);

      const response = await controller.update(id, dto);

      expect(mockImagesService.update).toHaveBeenCalledWith(id, dto);
      expect(response).toEqual(updated);
    });
  });

  describe('remove', () => {
    it('should delete image by id', async () => {
      const id = '1';
      const result = { deleted: true };
      mockImagesService.remove.mockResolvedValue(result);

      const response = await controller.remove(id);

      expect(mockImagesService.remove).toHaveBeenCalledWith(id);
      expect(response).toEqual(result);
    });
  });
});
