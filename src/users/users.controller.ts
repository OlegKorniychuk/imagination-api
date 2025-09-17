import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  NotFoundException,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { ImagesService } from 'src/images/images.service';
import { ImageSearchOptionsDto } from 'src/images/dto/image-search-options.dto';
import { S3Image, Image } from 'src/images/entities/image.entity';
import { S3Service } from 'src/s3/s3.service';
import { UserResponseDto } from './dto/user-response.dto';
import { plainToInstance } from 'class-transformer';

@Controller('users')
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private imagesService: ImagesService,
    private s3Service: S3Service,
  ) {}

  @Post()
  async create(@Body() createUserDto: CreateUserDto): Promise<UserResponseDto> {
    const newUser = await this.usersService.create(createUserDto);

    return plainToInstance(UserResponseDto, newUser);
  }

  @Get()
  async findAll(): Promise<UserResponseDto[]> {
    const users = await this.usersService.findAll();

    return plainToInstance(UserResponseDto, users);
  }

  @Get(':id/images')
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
  async findOne(@Param('id') id: string): Promise<UserResponseDto> {
    const user = await this.usersService.findOne(id);

    if (!user) throw new NotFoundException();

    return plainToInstance(UserResponseDto, user);
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto,
  ): Promise<UserResponseDto> {
    const updatedUser = await this.usersService.update(id, updateUserDto);

    if (!updatedUser) throw new NotFoundException();

    return plainToInstance(UserResponseDto, updatedUser);
  }

  @Delete(':id')
  async remove(@Param('id') id: string): Promise<UserResponseDto> {
    const deletedUser = await this.usersService.remove(id);

    if (!deletedUser) throw new NotFoundException();

    return plainToInstance(UserResponseDto, deletedUser);
  }
}
