import {
  Controller,
  Get,
  Param,
  Query,
  NotFoundException,
  SerializeOptions,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { ImagesService } from 'src/images/images.service';
import { ImageSearchOptionsDto } from 'src/images/dto/image-search-options.dto';
import { S3Image, Image } from 'src/images/entities/image.entity';
import { S3Service } from 'src/s3/s3.service';
import { UserResponseDto } from './dto/user-response.dto';
import { Public } from 'src/auth/public.decorator';

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
  async findUserImages(
    @Query() query: ImageSearchOptionsDto,
    @Param('id') id: string,
  ): Promise<S3Image[]> {
    const images: Image[] = await this.imagesService.findMany(query, id);
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
