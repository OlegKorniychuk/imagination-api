import { UserResponseDto } from 'src/modules/users/dto/user-response.dto';
import { ImageResponseDto } from './image-response.dto';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class ImageDetailsDto extends ImageResponseDto {
  @ApiProperty()
  @Type(() => UserResponseDto)
  author: UserResponseDto;
}
