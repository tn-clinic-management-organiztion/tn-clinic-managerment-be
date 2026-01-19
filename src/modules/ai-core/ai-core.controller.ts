// src/modules/ai-core/ai-core.controller.ts
import { RunAiDetectionDto } from './dto/annotation/run-ai-detection.dto';
import {
  Body,
  Controller,
  DefaultValuePipe,
  Get,
  HttpCode,
  HttpStatus,
  NotFoundException,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  Res,
  UploadedFile,
  UseInterceptors,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery, ApiConsumes } from '@nestjs/swagger';
import { AiCoreService } from './ai-core.service';
import {
  SaveHumanAnnotationDto,
  ApproveAnnotationDto,
  RejectAnnotationDto,
} from './dto/annotation/human-annotation.dto.js';
import { ToggleDeprecateDto } from './dto/annotation/toggle-deprecate.dto.js';
import { QueryResultImagesDto } from './dto/query-result-images.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { CreateAiAnnotationDto } from './dto/annotation/create-ai-annotation.dto.js';
import { UpdateAiAnnotationDto } from './dto/annotation/update-ai-annotation.dto.js';
import { ExportAnnotationsDto } from './dto/annotation/export-annotation.dto.js';
import type { Response } from 'express';
import archiver from 'archiver';
import { SkipTransform } from 'src/common/decorators/skip-transform.decorator';

@ApiTags('AI Core')
@Controller('ai-core')
export class AiCoreController {
  constructor(private readonly aiCoreService: AiCoreService) {}

  // ==================== AI DETECTION ====================
  // File
  @Post('detect/image')
  @HttpCode(HttpStatus.OK)
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({ summary: 'Run AI detection from uploaded image file (demo)' })
  async detectFromFile(
    @UploadedFile() file: Express.Multer.File,
    @Body() dto: Partial<RunAiDetectionDto>,
  ) {
    return await this.aiCoreService.runDetectionForUploadedFile(file, dto);
  }

  /**
   * Chạy AI Detection trên một ảnh
   * POST /ai-core/detect
   */
  // URL
  @Post('detect')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Run AI detection on image' })
  async triggerDetection(@Body() dto: RunAiDetectionDto) {
    return await this.aiCoreService.runDetectionForImage(dto);
  }

  // ==================== GALLERY (LIST IMAGES) ====================

  /**
   * Lấy danh sách ảnh với phân trang và filter
   * GET /ai-core/result-images?page=1&limit=10&status=TODO&search=lung
   */
  @Get('result-images')
  @ApiOperation({ summary: 'Get list of result images (Gallery view)' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({
    name: 'status',
    required: false,
    enum: ['TODO', 'REVIEW', 'DONE'],
  })
  @ApiQuery({ name: 'search', required: false, type: String })
  async getListResultImages(@Query() query: QueryResultImagesDto) {
    const { page = 1, limit = 10, status, search } = query;
    return await this.aiCoreService.getListResultImages(
      page,
      limit,
      status,
      search,
    );
  }

  // ==================== WORKSPACE (IMAGE DETAIL) ====================

  /**
   * Lấy chi tiết ảnh với AI reference và annotation history
   * GET /ai-core/result-images/:image_id
   */
  @Get('result-images/:image_id')
  @ApiOperation({ summary: 'Get image detail (Workspace view)' })
  async getResultImageDetail(@Param('image_id') image_id: string) {
    const data = await this.aiCoreService.getResultImageDetail(image_id);
    if (!data) throw new NotFoundException('Image not found');
    return data;
  }

  /**
   * Lấy annotation history của một ảnh
   * GET /ai-core/result-images/:image_id/history
   */
  @Get('result-images/:image_id/history')
  @ApiOperation({ summary: 'Get annotation history for an image' })
  async getAnnotationHistory(@Param('image_id') image_id: string) {
    return await this.aiCoreService.getAnnotationHistory(image_id);
  }

  // ==================== HUMAN ANNOTATION WORKFLOW ====================
  // Save AI detections to image_annotations for an image_id
  @Post('annotations')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Save AI detections to image_annotations for an image_id',
  })
  async saveAnnotation(@Body() dto: CreateAiAnnotationDto) {
    return await this.aiCoreService.saveAnnotationFromDetections(dto);
  }

  // Update AI detections to image_annotations for an image_id
  @Patch('annotations')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Update AI detections to image_annotations for an image_id',
  })
  async patchUpdateAnnotation(@Body() dto: UpdateAiAnnotationDto) {
    return await this.aiCoreService.updateAnnotationFromDetections(dto);
  }

  /**
   * Lưu/Cập nhật Human Annotation (Draft/Submit)
   * POST /ai-core/result-images/:image_id/human-annotations
   */
  @Post('result-images/:image_id/human-annotations')
  @ApiOperation({ summary: 'Save or submit human annotation' })
  async saveHumanAnnotation(
    @Param('image_id') image_id: string,
    @Body() dto: SaveHumanAnnotationDto,
  ) {
    return await this.aiCoreService.upsertHumanAnnotation(image_id, dto);
  }

  /**
   * Duyệt annotation (SUBMITTED -> APPROVED)
   * PATCH /ai-core/result-images/:image_id/approve
   */
  @Patch('result-images/:image_id/approve')
  @ApiOperation({ summary: 'Approve human annotation' })
  async approveHumanAnnotation(
    @Param('image_id') image_id: string,
    @Body() dto: ApproveAnnotationDto,
  ) {
    return await this.aiCoreService.approveHumanAnnotation(image_id, dto);
  }

  /**
   * Từ chối annotation (SUBMITTED -> REJECTED)
   * PATCH /ai-core/result-images/:image_id/reject
   */
  @Patch('result-images/:image_id/reject')
  @ApiOperation({ summary: 'Reject human annotation' })
  async rejectAnnotation(
    @Param('image_id') image_id: string,
    @Body() dto: RejectAnnotationDto,
  ) {
    return await this.aiCoreService.rejectAnnotation(image_id, dto);
  }

  // ==================== ANNOTATION MANAGEMENT ====================

  /**
   * Toggle deprecate status của một annotation
   * PATCH /ai-core/annotations/:annotation_id/deprecate
   */
  @Patch('annotations/:annotation_id/deprecate')
  @ApiOperation({ summary: 'Toggle deprecate status of annotation' })
  async toggleDeprecateAnnotation(
    @Param('annotation_id') annotation_id: string,
    @Body() dto: ToggleDeprecateDto,
  ) {
    return await this.aiCoreService.toggleDeprecateAnnotation(
      annotation_id,
      dto.is_deprecated,
      dto.reason,
    );
  }

  /**
   * Lấy chi tiết một annotation
   * GET /ai-core/annotations/:annotation_id
   */
  @Get('annotations/:annotation_id')
  @ApiOperation({ summary: 'Get annotation detail' })
  async getAnnotationDetail(@Param('annotation_id') annotation_id: string) {
    return await this.aiCoreService.getAnnotationDetail(annotation_id);
  }

  /**
   * So sánh AI vs Human annotations
   * GET /ai-core/result-images/:image_id/compare
   */
  @Get('result-images/:image_id/compare')
  @ApiOperation({ summary: 'Compare AI and Human annotations' })
  async compareAnnotations(@Param('image_id') image_id: string) {
    return await this.aiCoreService.compareAnnotations(image_id);
  }

  // ==================== STATISTICS ====================

  /**
   * Thống kê tổng quan
   * GET /ai-core/statistics/overview
   */
  @Get('statistics/overview')
  @ApiOperation({ summary: 'Get annotation statistics overview' })
  async getStatisticsOverview() {
    return await this.aiCoreService.getStatisticsOverview();
  }

  /**
   * Thống kê theo labeler
   * GET /ai-core/statistics/by-labeler/:staff_id
   */
  @Get('statistics/by-labeler/:staff_id')
  @ApiOperation({ summary: 'Get statistics by labeler' })
  async getLabelerStatistics(@Param('staff_id') staff_id: string) {
    return await this.aiCoreService.getLabelerStatistics(staff_id);
  }

  @Post('export/yolo.zip')
  @HttpCode(200)
  @SkipTransform()
  @UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
  async exportYoloZip(@Body() dto: ExportAnnotationsDto, @Res() res: Response) {
    const result = await this.aiCoreService.exportYOLO(dto);

    const zipName = `yolo_export_${new Date().toISOString().replace(/[:.]/g, '-')}.zip`;

    // header để browser tự download
    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', `attachment; filename="${zipName}"`);
    res.setHeader('Cache-Control', 'no-store');

    const archive = archiver('zip', { zlib: { level: 9 } });

    // Nếu zip lỗi -> kết thúc response
    archive.on('error', (err) => {
      // tránh response treo
      try {
        res.status(500).send(`Zip error: ${err.message}`);
      } catch {}
    });

    // pipe zip stream vào response
    archive.pipe(res);

    // append từng file vào zip
    for (const [path, content] of Object.entries(result.files)) {
      archive.append(content ?? '', { name: path });
    }

    // finalize => kết thúc zip
    await archive.finalize();
  }
}
