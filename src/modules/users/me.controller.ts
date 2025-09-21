import {
  Body,
  Controller,
  Delete,
  FileTypeValidator,
  Get,
  HttpCode,
  HttpException,
  HttpStatus,
  MaxFileSizeValidator,
  NotFoundException,
  Param,
  ParseFilePipe,
  Patch,
  Post,
  Query,
  Request,
  SerializeOptions,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { ImagesService } from 'src/modules/images/images.service';
import { S3Service } from 'src/modules/s3/s3.service';
import { AuthenticatedRequest } from 'src/entitites/auth-request';
import { UserResponseDto } from './dto/user-response.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { ImageSearchOptionsDto } from 'src/modules/images/dto/image-search-options.dto';
import { ImageResponseDto } from 'src/modules/images/dto/image-response.dto';
import { Image, S3Image } from 'src/modules/images/entities/image.entity';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiOperation, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { randomBytes } from 'crypto';
import { CreateImageDto } from 'src/modules/images/dto/create-image.dto';
import { UpdateImageDto } from 'src/modules/images/dto/update-image.dto';

@Controller('me')
export class MeController {
  constructor(
    private usersService: UsersService,
    private imagesService: ImagesService,
    private s3Service: S3Service,
  ) {}

  @Get()
  @SerializeOptions({ type: UserResponseDto })
  async readProfile(
    @Request() req: AuthenticatedRequest,
  ): Promise<UserResponseDto> {
    const user = await this.usersService.findOne(req.user.id);

    if (!user) throw new NotFoundException();

    return user;
  }

  @Patch()
  @SerializeOptions({ type: UserResponseDto })
  async updateProfile(
    @Request() request: AuthenticatedRequest,
    @Body() dto: UpdateUserDto,
  ): Promise<UserResponseDto> {
    const updatedUser = await this.usersService.update(request.user.id, dto);

    if (!updatedUser) throw new NotFoundException();

    return updatedUser;
  }

  @Get('images')
  @SerializeOptions({ type: ImageResponseDto })
  async readImages(
    @Request() request: AuthenticatedRequest,
    @Query() query: ImageSearchOptionsDto,
  ): Promise<ImageResponseDto[]> {
    const images: Image[] = await this.imagesService.findMany(
      query,
      request.user.id,
    );
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

  @Post('images')
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
  async createImage(
    @Request() reqest: AuthenticatedRequest,
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

  @Patch('images/:id')
  @SerializeOptions({ type: ImageResponseDto })
  async updateImage(
    @Request() reqest: AuthenticatedRequest,
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

  @Delete('images/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async removeImage(
    @Request() reqest: AuthenticatedRequest,
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
