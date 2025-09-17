import { ApiProperty } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsArray,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';

export class ImageSortOptionsDto {
  @IsIn(['title', 'createdAt', 'updatedAt'])
  field: 'title' | 'createdAt' | 'updatedAt';

  @IsIn(['asc', 'desc'])
  order: 'asc' | 'desc';
}

export class ImageFilterOptionsDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  author?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @Transform(({ value }) =>
    typeof value === 'string' ? value.split(',').map((t) => t.trim()) : [],
  )
  tags?: string[];
}

export class ImagePaginateOptionsDto {
  @IsInt()
  @Min(1)
  @Type(() => Number)
  pageSize: number;

  @IsInt()
  @Min(1)
  @Type(() => Number)
  page: number;
}

export class ImageSearchOptionsDto {
  @ApiProperty()
  @IsOptional()
  @ValidateNested()
  @Type(() => ImageSortOptionsDto)
  sort?: ImageSortOptionsDto;

  @ApiProperty()
  @IsOptional()
  @ValidateNested()
  @Type(() => ImageFilterOptionsDto)
  filter?: ImageFilterOptionsDto;

  @ApiProperty()
  @IsOptional()
  @ValidateNested()
  @Type(() => ImagePaginateOptionsDto)
  paginate?: ImagePaginateOptionsDto;
}
