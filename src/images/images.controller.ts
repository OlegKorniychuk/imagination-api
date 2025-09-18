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
  HttpCode,
  SerializeOptions,
  Request,
} from '@nestjs/common';
import { ImagesService } from './images.service';
import { UpdateImageDto } from './dto/update-image.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { CreateImageDto } from './dto/create-image.dto';
import { ImageSearchOptionsDto } from './dto/image-search-options.dto';
import { S3Service } from 'src/s3/s3.service';
import { randomBytes } from 'crypto';
import { Image, S3Image } from './entities/image.entity';
import { ApiBody, ApiConsumes, ApiOperation } from '@nestjs/swagger';
import { ImageResponseDto } from './dto/image-response.dto';
import { Public } from 'src/auth/public.decorator';

@Controller('images')
export class ImagesController {
  constructor(
    private readonly imagesService: ImagesService,
    private s3Service: S3Service,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Upload a new image' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        image: {
          type: 'string',
          format: 'binary',
        },
        title: { type: 'string' },
        description: { type: 'string' },
        tags: {
          type: 'array',
          items: { type: 'string' },
        },
      },
    },
  })
  @SerializeOptions({ type: ImageResponseDto })
  @UseInterceptors(FileInterceptor('image'))
  async create(
    @Request() reqest: { user: { id: string; email: string } },
    @Body() createImageDto: CreateImageDto,
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new FileTypeValidator({ fileType: /(jpg|jpeg|png)$/ }),
          new MaxFileSizeValidator({ maxSize: 500 * 1024 * 1024 }),
        ],
      }),
    )
    image: Express.Multer.File,
  ): Promise<ImageResponseDto> {
    const uniqueName: string = randomBytes(32).toString('hex');
    const newImage: Image = await this.imagesService.create(
      createImageDto,
      reqest.user.id,
      uniqueName,
    );
    try {
      await this.s3Service.uploadImage(image, uniqueName);
    } catch {
      await this.imagesService.remove(newImage.id, reqest.user.id);

      throw new HttpException(
        'Failed to save image',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }

    const url = await this.s3Service.getImageUrl(uniqueName, 3600);
    return { ...newImage, url };
  }

  @Get()
  @Public()
  @SerializeOptions({ type: ImageResponseDto })
  async findMany(
    @Query() query: ImageSearchOptionsDto,
  ): Promise<ImageResponseDto[]> {
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
  @SerializeOptions({ type: ImageResponseDto })
  async findOne(@Param('id') id: string): Promise<ImageResponseDto> {
    const image = await this.imagesService.findOne(id);

    if (!image) throw new NotFoundException();

    const url: string = await this.s3Service.getImageUrl(
      image.uniqueName,
      3600,
    );

    return { ...image, url };
  }

  @Patch(':id')
  @SerializeOptions({ type: ImageResponseDto })
  async update(
    @Request() reqest: { user: { id: string; email: string } },
    @Param('id') id: string,
    @Body() updateImageDto: UpdateImageDto,
  ): Promise<ImageResponseDto> {
    const updatedImage = await this.imagesService.update(
      id,
      updateImageDto,
      reqest.user.id,
    );

    if (!updatedImage) throw new NotFoundException();

    const url = await this.s3Service.getImageUrl(updatedImage.uniqueName, 3600);

    return { ...updatedImage, url };
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(
    @Request() reqest: { user: { id: string; email: string } },
    @Param('id') id: string,
  ): Promise<void> {
    const deletedImage = await this.imagesService.remove(id, reqest.user.id);

    if (!deletedImage) throw new NotFoundException();

    try {
      await this.s3Service.deleteImage(deletedImage.uniqueName);
    } catch (err) {
      console.log('Failed to delete image from S3');
      console.error(err);
    }

    return;
  }
}
