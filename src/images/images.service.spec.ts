import { Test, TestingModule } from '@nestjs/testing';
import { ImagesService } from './images.service';
import { DRIZZLE } from 'src/drizzle/drizzle.module';
import { CreateImageDto } from './dto/create-image.dto';
import { Image } from './entities/image.entity';
import { images } from 'src/drizzle/schema/images.schema';
import { UpdateImageDto } from './dto/update-image.dto';
import { MockDrizzleDB } from 'test/mocks/drizzle.mock';

const mockImage: Image = {
  id: 'a-valid-uuid',
  authorId: 'a-valid-uuid',
  uniqueName: 'a-unique-name',
  title: 'A beautiful sunset',
  description: null,
  tags: [],
  isPublic: true,
  createdAt: new Date(),
  updatedAt: new Date(),
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
    it('should create an image record and return it', async () => {
      const createImageDto: CreateImageDto = {
        title: mockImage.title,
      };
      const mockAuthorId = mockImage.authorId;
      const mockUniqueName = 'unique-name';

      mockDrizzleDB.returning.mockResolvedValue([mockImage]);

      const result = await service.create(
        createImageDto,
        mockUniqueName,
        mockAuthorId,
      );

      expect(mockDrizzleDB.insert).toHaveBeenCalledWith(images);
      expect(mockDrizzleDB.values).toHaveBeenLastCalledWith(
        expect.objectContaining(createImageDto),
      );
      expect(result).toEqual(mockImage);
    });
  });

  describe('findAll', () => {
    it('should return all images', async () => {
      mockDrizzleDB.innerJoin.mockResolvedValue([
        { images: mockImage },
        { images: mockImage },
      ]);

      const result = await service.findMany();

      expect(mockDrizzleDB.select).toHaveBeenCalled();
      expect(mockDrizzleDB.from).toHaveBeenCalledWith(images);
      expect(result.length).toBe(2);
      result.forEach((image) => {
        expect(image).toEqual(mockImage);
      });
    });
  });

  describe('findOne', () => {
    it('should return an image record', async () => {
      mockDrizzleDB.where.mockResolvedValue([mockImage]);

      const result = await service.findOne(mockImage.id);

      expect(mockDrizzleDB.select).toHaveBeenCalled();
      expect(mockDrizzleDB.from).toHaveBeenCalledWith(images);
      expect(mockDrizzleDB.where).toHaveBeenCalledWith(expect.anything());
      expect(result).toEqual(mockImage);
    });
  });

  describe('update', () => {
    it('should update an image record and return it', async () => {
      const mockUpdateData: UpdateImageDto = { title: 'new title' };
      mockDrizzleDB.where.mockReturnValueOnce([mockImage]);
      mockDrizzleDB.returning.mockResolvedValue([mockImage]);
      const mockAuthorId = mockImage.authorId;

      const result = await service.update(
        mockImage.id,
        mockUpdateData,
        mockAuthorId,
      );

      expect(mockDrizzleDB.update).toHaveBeenCalledWith(images);
      expect(mockDrizzleDB.set).toHaveBeenCalledWith(mockUpdateData);
      expect(result).toEqual(mockImage);
    });
  });

  describe('remove', () => {
    it('should delete an image record from DB', async () => {
      mockDrizzleDB.where.mockReturnValueOnce([mockImage]);
      mockDrizzleDB.returning.mockResolvedValue([mockImage]);
      const mockAuthorId = mockImage.authorId;

      const result = await service.remove(mockImage.id, mockAuthorId);

      expect(mockDrizzleDB.delete).toHaveBeenCalledWith(images);
      expect(result).toEqual(mockImage);
    });
  });
});
