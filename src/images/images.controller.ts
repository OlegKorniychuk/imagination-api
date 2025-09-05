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
} from '@nestjs/common';
import { ImagesService } from './images.service';
import { UpdateImageDto } from './dto/update-image.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { CreateImageDto } from './dto/create-image.dto';

@Controller('images')
export class ImagesController {
  constructor(private readonly imagesService: ImagesService) {}

  @Post()
  @UseInterceptors(FileInterceptor('image'))
  create(
    @Body() createImageDto: CreateImageDto,
    @UploadedFile() image: Express.Multer.File,
  ) {
    return this.imagesService.create(createImageDto, image);
  }

  @Get()
  findAll() {
    return this.imagesService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.imagesService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateImageDto: UpdateImageDto) {
    return this.imagesService.update(id, updateImageDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.imagesService.remove(id);
  }
}
