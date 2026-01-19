import { BulkUploadImagesDto } from './dto/images/bulk-upload-image.dto';
import { QueryResultImageDto } from './dto/images/query-image.dto';
import { UpdateResultImageDto } from './dto/images/update-image.dto';
import { CreateResultImageDto } from './dto/images/create-image.dto';
import { QueryResultDto } from './dto/results/query-result.dto';
import { UpdateResultDto } from './dto/results/update-result.dto';
import { CreateResultDto } from './dto/results/create-result.dto';
import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseInterceptors,
  UploadedFile,
  UploadedFiles,
} from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiConsumes } from '@nestjs/swagger';
import { ResultsService } from './results.service';

@ApiTags('Results')
@Controller('results')
export class ResultsController {
  constructor(private readonly resultsService: ResultsService) {}

  // ==================== SERVICE RESULTS ====================
  @Post()
  @ApiOperation({ summary: 'Create a new service result' })
  createResult(@Body() dto: CreateResultDto) {
    return this.resultsService.createResult(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all results with pagination' })
  findAllResults(@Query() query: QueryResultDto) {
    return this.resultsService.findAllResults(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get result by ID' })
  findOneResult(@Param('id') id: string) {
    return this.resultsService.findOneResult(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update result' })
  updateResult(@Param('id') id: string, @Body() dto: UpdateResultDto) {
    return this.resultsService.updateResult(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Soft delete result' })
  removeResult(@Param('id') id: string) {
    return this.resultsService.removeResult(id);
  }

  // ==================== RESULT IMAGES ====================
  @Post('images')
  @ApiOperation({ summary: 'Create image with URL' })
  createImage(@Body() dto: CreateResultImageDto) {
    return this.resultsService.createImage(dto);
  }

  @Post('images/upload')
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Upload image to Cloudinary' })
  uploadImage(
    @UploadedFile() file: Express.Multer.File,
    @Body() dto: CreateResultImageDto,
  ) {
    return this.resultsService.uploadImageToCloudinary(file, dto);
  }

  @Post('images/bulk-upload')
  @UseInterceptors(FilesInterceptor('files', 10))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Bulk upload images' })
  bulkUploadImages(
    @UploadedFiles() files: Express.Multer.File[],
    @Body() dto: BulkUploadImagesDto,
  ) {
    return this.resultsService.bulkUploadImages(files, dto);
  }

  @Get('images')
  @ApiOperation({ summary: 'Get all images with pagination' })
  findAllImages(@Query() query: QueryResultImageDto) {
    return this.resultsService.findAllImages(query);
  }

  @Get('images/:id')
  @ApiOperation({ summary: 'Get image by ID' })
  findOneImage(@Param('id') id: string) {
    return this.resultsService.findOneImage(id);
  }

  @Patch('images/:id')
  @ApiOperation({ summary: 'Update image' })
  updateImage(@Param('id') id: string, @Body() dto: UpdateResultImageDto) {
    return this.resultsService.updateImage(id, dto);
  }

  @Delete('images/:id')
  @ApiOperation({ summary: 'Delete image and from Cloudinary (delete annotations)' })
  removeImage(@Param('id') id: string) {
    return this.resultsService.deleteImage(id);
  }
}
