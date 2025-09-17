import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseInterceptors,
  UploadedFile,
  ParseFilePipe,
  FileTypeValidator,
  MaxFileSizeValidator,
  Query,
  HttpException,
  HttpStatus,
  NotFoundException,
} from '@nestjs/common';
import { ImagesService } from './images.service';
import { UpdateImageDto } from './dto/update-image.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { CreateImageDto } from './dto/create-image.dto';
import { ImageSearchOptionsDto } from './dto/image-search-options.dto';
import { S3Service } from 'src/s3/s3.service';
import { randomBytes } from 'crypto';
import { Image, S3Image } from './entities/image.entity';

@Controller('images')
export class ImagesController {
  constructor(
    private readonly imagesService: ImagesService,
    private s3Service: S3Service,
  ) {}

  @Post()
  @UseInterceptors(FileInterceptor('image'))
  async create(
    @Body() createImageDto: CreateImageDto,
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new FileTypeValidator({ fileType: /(jpg|jpeg|png)$/ }),
          new MaxFileSizeValidator({ maxSize: 500 * 1024 }),
        ],
      }),
    )
    image: Express.Multer.File,
  ) {
    const uniqueName: string = randomBytes(32).toString('hex');
    const newImage: Image = await this.imagesService.create(
      createImageDto,
      uniqueName,
    );
    try {
      await this.s3Service.uploadImage(image, uniqueName);
    } catch {
      await this.imagesService.remove(newImage.id);

      throw new HttpException(
        'Failed to save image',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }

    return newImage;
  }

  @Get()
  async findMany(@Query() query: ImageSearchOptionsDto) {
    const images: Image[] = await this.imagesService.findMany(query);
    const imagesWithUrls: S3Image[] = await Promise.all(
      images.map(async (image) => {
        const url: string = await this.s3Service.getImageUrl(
          image.uniqueName,
          3600,
        );

        return { ...image, url };
      }),
    );

    return imagesWithUrls;
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const image = await this.imagesService.findOne(id);

    if (!image) throw new NotFoundException();

    const url: string = await this.s3Service.getImageUrl(
      image.uniqueName,
      3600,
    );

    return { ...image, url };
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateImageDto: UpdateImageDto,
  ) {
    const updatedImage = await this.imagesService.update(id, updateImageDto);

    if (!updatedImage) throw new NotFoundException();

    return updatedImage;
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    const deletedImage = await this.imagesService.remove(id);

    if (!deletedImage) throw new NotFoundException();

    try {
      await this.s3Service.deleteImage(deletedImage.uniqueName);
    } catch (err) {
      console.log('Failed to delete image from S3');
      console.error(err);
    }

    return deletedImage;
  }
}
