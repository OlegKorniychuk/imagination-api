import {
  Controller,
  Get,
  Param,
  Query,
  NotFoundException,
  SerializeOptions,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { ImagesService } from 'src/modules/images/images.service';
import { ImageSearchOptionsDto } from 'src/modules/images/dto/image-search-options.dto';
import { S3Image } from 'src/modules/images/entities/image.entity';
import { S3Service } from 'src/modules/s3/s3.service';
import { UserResponseDto } from './dto/user-response.dto';
import { Public } from 'src/modules/auth/public.decorator';
import { PaginatedImagesResponseDto } from '../images/dto/image-response.dto';

@Controller('users')
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private imagesService: ImagesService,
    private s3Service: S3Service,
  ) {}

  // @Post()
  // @SerializeOptions({ type: UserResponseDto })
  // async create(@Body() createUserDto: CreateUserDto): Promise<UserResponseDto> {
  //   return await this.usersService.create(createUserDto);
  // }

  @Get()
  @Public()
  @SerializeOptions({ type: UserResponseDto })
  async findAll(): Promise<UserResponseDto[]> {
    return await this.usersService.findAll();
  }

  @Get(':id/images')
  @Public()
  @SerializeOptions({ type: PaginatedImagesResponseDto })
  async findUserImages(
    @Query() query: ImageSearchOptionsDto,
    @Param('id') id: string,
  ): Promise<PaginatedImagesResponseDto> {
    const imagesData = await this.imagesService.findMany(query, id);
    const imagesWithUrls: S3Image[] = await Promise.all(
      imagesData.images.map(async (image) => {
        const url: string = await this.s3Service.getImageUrl(
          image.uniqueName,
          3600,
        );

        return { ...image, url };
      }),
    );

    return { data: imagesWithUrls, nextPage: imagesData.nextPage };
  }

  @Get(':id')
  @Public()
  @SerializeOptions({ type: UserResponseDto })
  async findOne(@Param('id') id: string): Promise<UserResponseDto> {
    const user = await this.usersService.findOne(id);

    if (!user) throw new NotFoundException();

    return user;
  }

  // @Patch(':id')
  // @SerializeOptions({ type: UserResponseDto })
  // async update(
  //   @Param('id') id: string,
  //   @Body() updateUserDto: UpdateUserDto,
  // ): Promise<UserResponseDto> {
  //   const updatedUser = await this.usersService.update(id, updateUserDto);

  //   if (!updatedUser) throw new NotFoundException();

  //   return updatedUser;
  // }

  // @Delete(':id')
  // @HttpCode(HttpStatus.NO_CONTENT)
  // async remove(@Param('id') id: string): Promise<void> {
  //   const deletedUser = await this.usersService.remove(id);

  //   if (!deletedUser) throw new NotFoundException();

  //   return;
  // }
}
