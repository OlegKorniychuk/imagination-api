import { ApiProperty } from '@nestjs/swagger';
import { S3Image } from '../entities/image.entity';
import { Exclude, Type } from 'class-transformer';

export class ImageResponseDto implements S3Image {
  @ApiProperty()
  id: string;

  @ApiProperty()
  authorId: string;

  @ApiProperty()
  title: string;

  @ApiProperty()
  description: string | null;

  @ApiProperty()
  tags: string[];

  @Exclude()
  uniqueName: string;

  @ApiProperty()
  isPublic: boolean;

  @ApiProperty()
  url: string;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}

export class PaginatedImagesResponseDto {
  @ApiProperty()
  @Type(() => ImageResponseDto)
  data: ImageResponseDto[];
  @ApiProperty()
  nextPage: number | null;
}
