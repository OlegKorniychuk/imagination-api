import { IsArray, IsOptional, IsString } from 'class-validator';

export class CreateImageDto {
  @IsString()
  authorId: string;

  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];
}
