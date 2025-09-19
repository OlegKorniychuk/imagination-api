import {
  Controller,
  Get,
  NotFoundException,
  Param,
  Query,
  SerializeOptions,
} from '@nestjs/common';
import { ImagesService } from './images.service';
import { ImageSearchOptionsDto } from './dto/image-search-options.dto';
import { S3Service } from 'src/s3/s3.service';
import { Image, S3Image } from './entities/image.entity';
import { ImageResponseDto } from './dto/image-response.dto';
import { Public } from 'src/auth/public.decorator';

@Controller('images')
export class ImagesController {
  constructor(
    private readonly imagesService: ImagesService,
    private s3Service: S3Service,
  ) {}

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
  @Public()
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
}
