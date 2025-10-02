import { Injectable } from '@nestjs/common';
import { faker } from '@faker-js/faker';
import axios from 'axios';
import { randomBytes } from 'crypto';
import { ImagesService } from '../images/images.service';
import { S3Service } from '../s3/s3.service';
import { User } from '../users/entities/user.entity';
import { UsersService } from '../users/users.service';
import { CreateImageDto } from '../images/dto/create-image.dto';

@Injectable()
export class SeedService {
  private DEV_PASSWORD = 'Password_123';
  private TAGS_COUNT = 20;

  constructor(
    private readonly usersService: UsersService,
    private readonly imagesService: ImagesService,
    private readonly s3Service: S3Service,
  ) {}

  async seed(usersCount: number, imagesPerUser: number) {
    console.log('Seeding started...');

    // 1. Seed Users
    const users = await this.seedUsers(usersCount);
    console.log(`${users.length} users created.`);

    // 2. Seed Images for those users
    const images = await this.seedImages(users, imagesPerUser);
    console.log(`${images.length} images created and uploaded.`);

    console.log('Seeding finished successfully!');
  }

  private async seedUsers(count: number) {
    const users = [];
    for (let i = 0; i < count; i++) {
      const user = await this.usersService.create({
        email: faker.internet.email(),
        password: this.DEV_PASSWORD,
        username: faker.internet.username(),
      });
      users.push(user);
    }
    return users;
  }

  private async seedImages(users: User[], imagesPerUser: number) {
    // prepare tags
    const existingTags: string[] = [];
    for (let i = 0; i < this.TAGS_COUNT; i++) {
      existingTags.push(
        faker.word.noun({ length: { min: 3, max: 10 }, strategy: 'shortest' }),
      );
    }

    const promises = [];

    for (const author of users) {
      for (let i = 0; i < imagesPerUser; i++) {
        const imagePromise = async () => {
          const uniqueName = randomBytes(32).toString('hex');

          // prepare record data
          const isPublic = Math.random() < 0.7;
          const tagsCount = Math.floor(Math.random() * 5);
          const tags = new Set<string>();

          while (tags.size < tagsCount) {
            tags.add(
              existingTags[Math.floor(Math.random() * existingTags.length)],
            );
          }

          const createImage: CreateImageDto = {
            title: faker.lorem.sentence(),
            description: faker.lorem.paragraph(),
            tags: Array.from(tags),
            isPublic,
          };

          const imageRecord = await this.imagesService.create(
            createImage,
            author.id,
            uniqueName,
          );

          const imageBuffer = await this.downloadRandomImage();
          await this.s3Service.uploadImage(
            {
              buffer: imageBuffer,
              mimetype: 'image/jpeg',
            } as Express.Multer.File,
            uniqueName,
          );
          return imageRecord;
        };

        promises.push(imagePromise());
      }
    }

    return Promise.all(promises);
  }

  private async downloadRandomImage(): Promise<Buffer> {
    const response = await axios.get('https://picsum.photos/800/600', {
      responseType: 'arraybuffer',
    });
    return Buffer.from(response.data, 'binary');
  }
}
