import { UpdateAiAnnotationDto } from 'src/modules/ai-core/dto/annotation/update-ai-annotation.dto';
import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Brackets, Repository, In } from 'typeorm';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';

import {
  ImageAnnotation,
  AnnotationSource,
  AnnotationStatus,
} from 'src/database/entities/ai/image_annotations.entity';
import { ResultImage } from 'src/database/entities/service/result_images.entity';
import { StaffProfile } from 'src/database/entities/auth/staff_profiles.entity';
import {
  ApproveAnnotationDto,
  RejectAnnotationDto,
  SaveHumanAnnotationDto,
} from './dto/annotation/human-annotation.dto';
import { RunAiDetectionDto } from './dto/annotation/run-ai-detection.dto';
import { ExportAnnotationsDto } from 'src/modules/ai-core/dto/annotation/export-annotation.dto';
import FormData from 'form-data';
import { CreateAiAnnotationDto } from './dto/annotation/create-ai-annotation.dto';
import { DeleteAiAnnotationDto } from 'src/modules/ai-core/dto/annotation/delete-ai-annotation.dto';

@Injectable()
export class AiCoreService {
  private readonly logger = new Logger(AiCoreService.name);
  private readonly aiServiceUrl: string;

  constructor(
    @InjectRepository(ResultImage)
    private readonly resultImageRepo: Repository<ResultImage>,
    @InjectRepository(ImageAnnotation)
    private readonly imageAnnotationRepo: Repository<ImageAnnotation>,
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    this.aiServiceUrl =
      this.configService.get<string>('AI_SERVICE_URL') ||
      'http://localhost:8000/api/v1';
  }

  // ==================== 1. AI DETECTION ====================
  async runDetectionForImage(dto: RunAiDetectionDto) {
    const imageRecord = await this.resultImageRepo.findOne({
      where: { image_id: dto.image_id },
    });

    if (!imageRecord) throw new NotFoundException(`Image not found`);
    if (!imageRecord.original_image_url)
      throw new NotFoundException('Image URL empty');

    try {
      this.logger.log(`Sending image ${dto.image_id} to AI...`);
      const response = await firstValueFrom(
        this.httpService.post(`${this.aiServiceUrl}/detect/url`, {
          image_url: imageRecord.original_image_url,
          model_name: dto.model_name,
          confidence_threshold: dto.confidence,
          iou_threshold: 0.4,
        }),
      );

      const newAnnotation = this.imageAnnotationRepo.create({
        image_id: imageRecord.image_id,
        annotation_source: AnnotationSource.AI,
        annotation_data: response.data.detections,
        ai_model_name: response.data.model,
        ai_model_version: 'v1.0',
        annotation_status: AnnotationStatus.APPROVED,
        labeled_at: new Date(),
      });

      return await this.imageAnnotationRepo.save(newAnnotation);
    } catch (error) {
      this.logger.error('AI Service Error', error.message);
      throw new InternalServerErrorException('AI Service Failed');
    }
  }

  async runDetectionForUploadedFile(
    file: Express.Multer.File,
    dto: { model_name?: string; confidence?: number },
  ) {
    if (!file) throw new BadRequestException('File is required');

    try {
      // Tạo FormData từ package form-data
      const form = new FormData();

      // Append file buffer với đúng format
      form.append('file', file.buffer, {
        filename: file.originalname,
        contentType: file.mimetype,
      });

      const params = {
        model_name: dto.model_name,
        confidence_threshold: dto.confidence ?? 0.25,
        iou_threshold: 0.4,
      };

      // Gửi request với headers từ form-data
      const response = await firstValueFrom(
        this.httpService.post(`${this.aiServiceUrl}/detect/image`, form, {
          params,
          headers: {
            ...form.getHeaders(),
          },
          maxBodyLength: Infinity,
          maxContentLength: Infinity,
        }),
      );

      // Trả về detections để FE vẽ bbox
      return response.data;
    } catch (error) {
      this.logger.error('AI Service Error (detect/image)', error?.message);
      if (error.response) {
        this.logger.error('Response data:', error.response.data);
        this.logger.error('Response status:', error.response.status);
      }
      throw new InternalServerErrorException('AI Service Failed');
    }
  }

  async saveAnnotationFromDetections(dto: CreateAiAnnotationDto) {
    const imageRecord = await this.resultImageRepo.findOne({
      where: { image_id: dto.image_id },
    });
    if (!imageRecord) throw new NotFoundException(`Image not found`);

    const ann = this.imageAnnotationRepo.create({
      image_id: dto.image_id,
      annotation_source: AnnotationSource.AI,
      annotation_data: dto.detections ?? [],
      ai_model_name: dto.model_name ?? 'yolov12n',
      ai_model_version: 'v1.0',
      annotation_status: AnnotationStatus.APPROVED,
      labeled_at: new Date(),
    });

    return await this.imageAnnotationRepo.save(ann);
  }

  async updateAnnotationFromDetections(dto: UpdateAiAnnotationDto) {
    const imageRecord = await this.resultImageRepo.findOne({
      where: { image_id: dto.image_id },
    });
    if (!imageRecord) throw new NotFoundException(`Image not found`);

    const existingAnn = await this.imageAnnotationRepo.findOne({
      where: {
        image_id: dto.image_id,
        annotation_source: AnnotationSource.AI,
      },
    });

    if (!existingAnn) {
      throw new NotFoundException(`Annotation for this image not found`);
    }

    Object.assign(existingAnn, {
      annotation_data: dto.detections ?? [],
      ai_model_name: dto.model_name ?? 'yolov12n',
      ai_model_version: 'v1.0',
      labeled_at: new Date(),
    });

    return await this.imageAnnotationRepo.save(existingAnn);
  }

  // ==================== 2. GALLERY (LIST) ====================
  async getListResultImages(
    page: number,
    limit: number,
    filterStatus?: string,
    searchName?: string,
  ) {
    const query = this.resultImageRepo
      .createQueryBuilder('img')
      .leftJoinAndMapOne(
        'img.uploader',
        StaffProfile,
        'uploader',
        'uploader.staff_id = img.uploaded_by',
      )
      .leftJoinAndMapMany(
        'img.annotations',
        ImageAnnotation,
        'ann',
        'ann.image_id = img.image_id',
      )
      .leftJoinAndMapOne(
        'ann.labeler',
        StaffProfile,
        'labeler',
        'labeler.staff_id = ann.labeled_by',
      )
      .leftJoinAndMapOne(
        'ann.approver',
        StaffProfile,
        'approver',
        'approver.staff_id = ann.approved_by',
      )
      .orderBy('img.uploaded_at', 'DESC');

    // Search filter
    if (searchName) {
      query.andWhere(
        '(img.file_name ILIKE :search OR uploader.full_name ILIKE :search)',
        { search: `%${searchName}%` },
      );
    }

    // Status filter
    if (filterStatus) {
      if (filterStatus === 'DONE') {
        query.andWhere(
          'ann.annotation_status = :st AND ann.annotation_source = :source',
          {
            st: AnnotationStatus.APPROVED,
            source: AnnotationSource.HUMAN,
          },
        );
      } else if (filterStatus === 'REVIEW') {
        query.andWhere('ann.annotation_status = :st', {
          st: AnnotationStatus.SUBMITTED,
        });
      } else if (filterStatus === 'TODO') {
        const hasValidHumanAnnotation = `
        EXISTS (
          SELECT 1 FROM image_annotations ha
          WHERE ha.image_id = img.image_id
          AND ha.annotation_source = '${AnnotationSource.HUMAN}'
          AND ha.annotation_status IN ('${AnnotationStatus.APPROVED}', '${AnnotationStatus.SUBMITTED}')
        )
      `;
        query.andWhere(
          new Brackets((qb) => {
            // 1. Ảnh chưa có annotation nào
            qb.where('ann.annotation_id IS NULL')
              // 2. Ảnh có HUMAN annotation bị REJECTED/IN_PROGRESS/DEPRECATED và không có anno nào được APPROVED
              .orWhere(
                `ann.annotation_source = :source AND ann.annotation_status IN (:...st) AND NOT ${hasValidHumanAnnotation}`,
                {
                  source: AnnotationSource.HUMAN,
                  st: [
                    AnnotationStatus.IN_PROGRESS,
                    AnnotationStatus.REJECTED,
                    AnnotationStatus.DEPRECATED,
                  ],
                },
              )
              // 3. Ảnh chỉ có AI annotation (chưa có HUMAN annotation nào APPROVED/SUBMITTED)
              .orWhere(
                `ann.annotation_source = :aiSource AND NOT ${hasValidHumanAnnotation}`,
                {
                  aiSource: AnnotationSource.AI,
                },
              );
          }),
        );
      }
    }

    const totalItems = await query.getCount();
    query.skip((page - 1) * limit).take(limit);
    const rawResults = await query.getMany();

    const mappedData = rawResults.map((item: any) => {
      const anns = item.annotations || [];

      const humanAnn = anns
        .filter(
          (a) =>
            a.annotation_source === AnnotationSource.HUMAN &&
            a.annotation_status !== AnnotationStatus.DEPRECATED,
        )
        .sort(
          (a, b) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
        )[0];

      const aiAnn = anns.find(
        (a) => a.annotation_source === AnnotationSource.AI,
      );

      return {
        image_id: item.image_id,
        file_name: item.file_name,
        original_image_url: item.original_image_url,
        uploaded_by_name: item.uploader?.full_name || 'System',
        uploaded_at: item.uploaded_at,
        current_status: humanAnn ? humanAnn.annotation_status : 'UNLABELED',
        has_ai_reference: !!aiAnn,
        labeled_by_name: humanAnn?.labeler?.full_name,
        approved_by_name: humanAnn?.approver?.full_name,
      };
    });

    return {
      items: mappedData,
      meta: {
        total_items: totalItems,
        current_page: page,
        items_per_page: limit,
        total_pages: Math.ceil(totalItems / limit),
      },
    };
  }

  // ==================== 3. WORKSPACE DETAIL ====================
  async getResultImageDetail(image_id: string) {
    const item: any = await this.resultImageRepo
      .createQueryBuilder('img')
      .leftJoinAndMapOne(
        'img.uploader',
        StaffProfile,
        'uploader',
        'uploader.staff_id = img.uploaded_by',
      )
      .leftJoinAndMapMany(
        'img.annotations',
        ImageAnnotation,
        'ann',
        'ann.image_id = img.image_id',
      )
      .leftJoinAndMapOne(
        'ann.labeler',
        StaffProfile,
        'labeler',
        'labeler.staff_id = ann.labeled_by',
      )
      .leftJoinAndMapOne(
        'ann.approver',
        StaffProfile,
        'approver',
        'approver.staff_id = ann.approved_by',
      )
      .where('img.image_id = :id', { id: image_id })
      .orderBy('ann.created_at', 'DESC')
      .getOne();

    if (!item) return null;

    const aiAnn = item.annotations?.find(
      (a) => a.annotation_source === AnnotationSource.AI,
    );
    const humanAnns =
      item.annotations?.filter(
        (a) => a.annotation_source === AnnotationSource.HUMAN,
      ) || [];

    return {
      image_info: {
        image_id: item.image_id,
        original_image_url: item.original_image_url,
        file_name: item.file_name,
        uploaded_by_name: item.uploader?.full_name || 'System',
        uploaded_at: item.uploaded_at,
      },
      ai_reference: aiAnn
        ? { data: aiAnn.annotation_data, model: aiAnn.ai_model_name }
        : null,
      annotation_history: humanAnns.map((ann) => ({
        annotation_id: ann.annotation_id,
        annotation_data: ann.annotation_data,
        status: ann.annotation_status,
        rejection_reason: ann.rejection_reason,
        deprecation_reason: ann.deprecation_reason,
        labeled_by_name: ann.labeler?.full_name,
        created_at: ann.created_at,
        approved_by_name: ann.approver?.full_name,
      })),
    };
  }

  // ==================== 4. UPSERT ANNOTATION ====================
  async upsertHumanAnnotation(image_id: string, dto: SaveHumanAnnotationDto) {
    const workflowAnnotation = await this.imageAnnotationRepo.findOne({
      where: {
        image_id: image_id,
        annotation_source: AnnotationSource.HUMAN,
        annotation_status: In([
          AnnotationStatus.IN_PROGRESS,
          AnnotationStatus.SUBMITTED,
        ]),
      },
      order: { created_at: 'DESC' },
    });

    if (workflowAnnotation) {
      workflowAnnotation.annotation_data = dto.annotation_data;
      workflowAnnotation.labeled_by = dto.labeled_by;
      workflowAnnotation.labeled_at = new Date();
      workflowAnnotation.annotation_status = AnnotationStatus.SUBMITTED;
      workflowAnnotation.approved_by = null;
      workflowAnnotation.approved_at = null;
      workflowAnnotation.rejection_reason = null;

      return await this.imageAnnotationRepo.save(workflowAnnotation);
    }

    const concludedAnnotation = await this.imageAnnotationRepo.findOne({
      where: {
        image_id: image_id,
        annotation_source: AnnotationSource.HUMAN,
        annotation_status: In([
          AnnotationStatus.APPROVED,
          AnnotationStatus.REJECTED,
        ]),
      },
      order: { created_at: 'DESC' },
    });

    if (concludedAnnotation?.annotation_status === AnnotationStatus.APPROVED) {
      concludedAnnotation.annotation_status = AnnotationStatus.DEPRECATED;
      concludedAnnotation.deprecation_reason =
        'Đã chỉnh sửa và nộp phiên bản mới';
      await this.imageAnnotationRepo.save(concludedAnnotation);

      const newVersion = this.imageAnnotationRepo.create({
        image_id: image_id,
        annotation_source: AnnotationSource.HUMAN,
        annotation_data: dto.annotation_data,
        labeled_by: dto.labeled_by,
        annotation_status: AnnotationStatus.SUBMITTED,
        created_at: new Date(),
      });
      return await this.imageAnnotationRepo.save(newVersion);
    }

    const newAnnotation = this.imageAnnotationRepo.create({
      image_id: image_id,
      annotation_source: AnnotationSource.HUMAN,
      annotation_data: dto.annotation_data,
      labeled_by: dto.labeled_by,
      annotation_status: AnnotationStatus.SUBMITTED,
      created_at: new Date(),
    });
    return await this.imageAnnotationRepo.save(newAnnotation);
  }

  // ==================== 5. APPROVE ====================
  async approveHumanAnnotation(image_id: string, dto: ApproveAnnotationDto) {
    const annotation = await this.imageAnnotationRepo.findOne({
      where: {
        image_id: image_id,
        annotation_source: AnnotationSource.HUMAN,
        annotation_status: AnnotationStatus.SUBMITTED,
      },
      order: { created_at: 'DESC' },
    });

    if (!annotation) {
      throw new NotFoundException('Không tìm thấy bản ghi SUBMITTED để duyệt');
    }

    annotation.annotation_status = AnnotationStatus.APPROVED;
    annotation.approved_by = dto.approved_by;
    annotation.approved_at = new Date();
    annotation.rejection_reason = null;

    return await this.imageAnnotationRepo.save(annotation);
  }

  // ==================== 6. REJECT ====================
  async rejectAnnotation(imageId: string, dto: RejectAnnotationDto) {
    const annotation = await this.imageAnnotationRepo.findOne({
      where: {
        image_id: imageId,
        annotation_source: AnnotationSource.HUMAN,
        annotation_status: AnnotationStatus.SUBMITTED,
      },
      order: { created_at: 'DESC' },
    });

    if (!annotation) {
      throw new NotFoundException(
        'Không tìm thấy bản ghi SUBMITTED để từ chối',
      );
    }

    annotation.annotation_status = AnnotationStatus.REJECTED;
    annotation.rejection_reason = dto.reason;
    annotation.reviewed_at = new Date();
    annotation.approved_by = null;
    annotation.approved_at = null;

    return await this.imageAnnotationRepo.save(annotation);
  }

  // ==================== 7. TOGGLE DEPRECATE ====================
  async toggleDeprecateAnnotation(
    annotationId: string,
    isDeprecated: boolean,
    reason?: string,
  ) {
    const annotation = await this.imageAnnotationRepo.findOne({
      where: { annotation_id: annotationId },
    });

    if (!annotation) throw new NotFoundException('Annotation not found');

    if (isDeprecated) {
      annotation.annotation_status = AnnotationStatus.DEPRECATED;
      annotation.deprecation_reason = reason || 'Đánh dấu thủ công';
      return await this.imageAnnotationRepo.save(annotation);
    }

    const restoredVersion = this.imageAnnotationRepo.create({
      image_id: annotation.image_id,
      annotation_source: AnnotationSource.HUMAN,
      annotation_data: annotation.annotation_data,
      labeled_by: annotation.labeled_by,
      annotation_status: AnnotationStatus.SUBMITTED,
      created_at: new Date(),
    });

    return await this.imageAnnotationRepo.save(restoredVersion);
  }

  // ==================== 8. ANNOTATION HISTORY ====================
  async getAnnotationHistory(image_id: string) {
    const annotations = await this.imageAnnotationRepo.find({
      where: { image_id },
      relations: ['labeled_by_staff', 'approved_by_staff'],
      order: { created_at: 'DESC' },
    });

    return {
      image_id,
      total_annotations: annotations.length,
      history: annotations.map((ann) => ({
        annotation_id: ann.annotation_id,
        source: ann.annotation_source,
        status: ann.annotation_status,
        annotation_data: ann.annotation_data,
        ai_model: ann.ai_model_name,
        labeled_by: ann.labeled_by_staff?.full_name,
        labeled_at: ann.labeled_at,
        reviewed_at: ann.reviewed_at,
        approved_by: ann.approved_by_staff?.full_name,
        approved_at: ann.approved_at,
        rejection_reason: ann.rejection_reason,
        deprecation_reason: ann.deprecation_reason,
        created_at: ann.created_at,
      })),
    };
  }

  // ==================== 9. ANNOTATION DETAIL ====================
  async getAnnotationDetail(annotation_id: string) {
    const annotation = await this.imageAnnotationRepo.findOne({
      where: { annotation_id },
      relations: ['image', 'labeled_by_staff', 'approved_by_staff'],
    });

    if (!annotation) {
      throw new NotFoundException('Annotation not found');
    }

    return {
      annotation_id: annotation.annotation_id,
      image_id: annotation.image_id,
      image_url: annotation.image?.original_image_url,
      source: annotation.annotation_source,
      status: annotation.annotation_status,
      annotation_data: annotation.annotation_data,
      ai_model_name: annotation.ai_model_name,
      ai_model_version: annotation.ai_model_version,
      labeled_by: {
        id: annotation.labeled_by,
        name: annotation.labeled_by_staff?.full_name,
      },
      labeled_at: annotation.labeled_at,
      reviewed_at: annotation.reviewed_at,
      approved_by: {
        id: annotation.approved_by,
        name: annotation.approved_by_staff?.full_name,
      },
      approved_at: annotation.approved_at,
      rejection_reason: annotation.rejection_reason,
      deprecation_reason: annotation.deprecation_reason,
      created_at: annotation.created_at,
    };
  }

  // ==================== 10. COMPARE ====================
  async compareAnnotations(image_id: string) {
    const annotations = await this.imageAnnotationRepo.find({
      where: { image_id },
      relations: ['labeled_by_staff'],
      order: { created_at: 'DESC' },
    });

    const aiAnnotation = annotations.find(
      (a) => a.annotation_source === AnnotationSource.AI,
    );

    const humanAnnotation = annotations.find(
      (a) =>
        a.annotation_source === AnnotationSource.HUMAN &&
        a.annotation_status === AnnotationStatus.APPROVED,
    );

    if (!aiAnnotation && !humanAnnotation) {
      return {
        message: 'No annotations found to compare',
        image_id,
      };
    }

    let metrics: any = null;
    if (aiAnnotation && humanAnnotation) {
      metrics = this.calculateComparisonMetrics(
        aiAnnotation.annotation_data,
        humanAnnotation.annotation_data,
      );
    }

    return {
      image_id,
      ai_annotation: aiAnnotation
        ? {
            annotation_id: aiAnnotation.annotation_id,
            model: aiAnnotation.ai_model_name,
            data: aiAnnotation.annotation_data,
            created_at: aiAnnotation.created_at,
          }
        : null,
      human_annotation: humanAnnotation
        ? {
            annotation_id: humanAnnotation.annotation_id,
            labeled_by: humanAnnotation.labeled_by_staff?.full_name,
            data: humanAnnotation.annotation_data,
            created_at: humanAnnotation.created_at,
          }
        : null,
      comparison_metrics: metrics,
    };
  }

  private calculateComparisonMetrics(aiData: any[], humanData: any[]) {
    const aiBoxCount = aiData?.length || 0;
    const humanBoxCount = humanData?.length || 0;

    let matchedBoxes = 0;
    let avgIoU = 0;

    if (Array.isArray(aiData) && Array.isArray(humanData)) {
      matchedBoxes = Math.min(aiBoxCount, humanBoxCount);
    }

    return {
      ai_box_count: aiBoxCount,
      human_box_count: humanBoxCount,
      matched_boxes: matchedBoxes,
      precision: aiBoxCount > 0 ? matchedBoxes / aiBoxCount : 0,
      recall: humanBoxCount > 0 ? matchedBoxes / humanBoxCount : 0,
      avg_iou: avgIoU,
    };
  }

  // ==================== 11. STATISTICS OVERVIEW ====================
  async getStatisticsOverview() {
    const [
      totalImages,
      totalAnnotations,
      aiAnnotations,
      humanAnnotations,
      approvedAnnotations,
      pendingAnnotations,
    ] = await Promise.all([
      this.resultImageRepo.count(),
      this.imageAnnotationRepo.count(),
      this.imageAnnotationRepo.count({
        where: { annotation_source: AnnotationSource.AI },
      }),
      this.imageAnnotationRepo.count({
        where: { annotation_source: AnnotationSource.HUMAN },
      }),
      this.imageAnnotationRepo.count({
        where: {
          annotation_source: AnnotationSource.HUMAN,
          annotation_status: AnnotationStatus.APPROVED,
        },
      }),
      this.imageAnnotationRepo.count({
        where: {
          annotation_source: AnnotationSource.HUMAN,
          annotation_status: In([
            AnnotationStatus.IN_PROGRESS,
            AnnotationStatus.SUBMITTED,
          ]),
        },
      }),
    ]);

    const imagesWithoutAnnotation = await this.resultImageRepo
      .createQueryBuilder('img')
      .leftJoin(
        'image_annotations',
        'ann',
        'ann.image_id = img.image_id AND ann.annotation_source = :source',
        { source: AnnotationSource.HUMAN },
      )
      .where('ann.annotation_id IS NULL')
      .getCount();

    return {
      images: {
        total: totalImages,
        without_annotation: imagesWithoutAnnotation,
        with_annotation: totalImages - imagesWithoutAnnotation,
      },
      annotations: {
        total: totalAnnotations,
        ai: aiAnnotations,
        human: humanAnnotations,
        approved: approvedAnnotations,
        pending: pendingAnnotations,
      },
      progress: {
        completion_rate:
          totalImages > 0
            ? ((approvedAnnotations / totalImages) * 100).toFixed(2)
            : 0,
        approval_rate:
          humanAnnotations > 0
            ? ((approvedAnnotations / humanAnnotations) * 100).toFixed(2)
            : 0,
      },
    };
  }

  // ==================== 12. LABELER STATISTICS ====================
  async getLabelerStatistics(staff_id: string) {
    const [totalAnnotated, approved, rejected, inProgress, submitted] =
      await Promise.all([
        this.imageAnnotationRepo.count({
          where: {
            labeled_by: staff_id,
            annotation_source: AnnotationSource.HUMAN,
          },
        }),
        this.imageAnnotationRepo.count({
          where: {
            labeled_by: staff_id,
            annotation_status: AnnotationStatus.APPROVED,
          },
        }),
        this.imageAnnotationRepo.count({
          where: {
            labeled_by: staff_id,
            annotation_status: AnnotationStatus.REJECTED,
          },
        }),
        this.imageAnnotationRepo.count({
          where: {
            labeled_by: staff_id,
            annotation_status: AnnotationStatus.IN_PROGRESS,
          },
        }),
        this.imageAnnotationRepo.count({
          where: {
            labeled_by: staff_id,
            annotation_status: AnnotationStatus.SUBMITTED,
          },
        }),
      ]);

    const recentAnnotations = await this.imageAnnotationRepo.find({
      where: {
        labeled_by: staff_id,
        annotation_source: AnnotationSource.HUMAN,
      },
      relations: ['image'],
      order: { created_at: 'DESC' },
      take: 10,
    });

    return {
      staff_id,
      statistics: {
        total_annotated: totalAnnotated,
        approved: approved,
        rejected: rejected,
        in_progress: inProgress,
        submitted: submitted,
        approval_rate:
          totalAnnotated > 0
            ? ((approved / totalAnnotated) * 100).toFixed(2)
            : 0,
        rejection_rate:
          totalAnnotated > 0
            ? ((rejected / totalAnnotated) * 100).toFixed(2)
            : 0,
      },
      recent_activity: recentAnnotations.map((ann) => ({
        annotation_id: ann.annotation_id,
        image_id: ann.image_id,
        status: ann.annotation_status,
        created_at: ann.created_at,
        approved_at: ann.approved_at,
      })),
    };
  }

  /**
   * EXPORT ANNOTATIONS - COCO FORMAT
   */
  // async exportCOCO(dto: ExportAnnotationsDto) {
  //   // Get annotations
  //   const annotations = await this.getAnnotationsForExport(dto);

  //   if (annotations.length === 0) {
  //     throw new NotFoundException('No annotations found to export');
  //   }

  //   // Build COCO format
  //   const cocoData = {
  //     info: {
  //       description: 'Medical Image Annotations',
  //       version: '1.0',
  //       year: new Date().getFullYear(),
  //       contributor: 'Hospital AI Team',
  //       date_created: new Date().toISOString(),
  //     },
  //     licenses: [],
  //     images: [],
  //     annotations: [],
  //     categories: [],
  //   };

  //   // Map unique classes
  //   const classMap = new Map<string, number>();
  //   let classId = 1;

  //   // Process each annotation
  //   let annotationId = 1;
  //   const imageMap = new Map<string, number>();
  //   let imageId = 1;

  //   for (const ann of annotations) {
  //     // Add image info (chỉ metadata, không có file)
  //     if (!imageMap.has(ann.image_id)) {
  //       imageMap.set(ann.image_id, imageId);

  //       cocoData.images.push({
  //         id: imageId,
  //         file_name: ann.image?.file_name || `image_${imageId}.png`,
  //         width: ann.image_width || 1024,
  //         height: ann.image_height || 1024,
  //         date_captured: ann.created_at,
  //         // URL để reference, không download
  //         coco_url: ann.image?.original_image_url,
  //       });
  //       imageId++;
  //     }

  //     const currentImageId = imageMap.get(ann.image_id);

  //     // Process bounding boxes
  //     const boxes = Array.isArray(ann.annotation_data) ? ann.annotation_data : [];

  //     for (const box of boxes) {
  //       // Add class if not exists
  //       const className = box.class?.name || 'unknown';
  //       if (!classMap.has(className)) {
  //         classMap.set(className, classId);
  //         cocoData.categories.push({
  //           id: classId,
  //           name: className,
  //           supercategory: 'medical',
  //         });
  //         classId++;
  //       }

  //       // Convert bbox to COCO format [x, y, width, height]
  //       const bbox = box.bbox || {};
  //       const cocoBox = [
  //         bbox.x1 || 0,
  //         bbox.y1 || 0,
  //         (bbox.x2 || 0) - (bbox.x1 || 0), // width
  //         (bbox.y2 || 0) - (bbox.y1 || 0), // height
  //       ];

  //       const area = cocoBox[2] * cocoBox[3];

  //       cocoData.annotations.push({
  //         id: annotationId,
  //         image_id: currentImageId,
  //         category_id: classMap.get(className),
  //         bbox: cocoBox,
  //         area: area,
  //         iscrowd: 0,
  //         segmentation: [], // Không có segmentation
  //       });
  //       annotationId++;
  //     }
  //   }

  //   return {
  //     format: 'COCO',
  //     total_images: cocoData.images.length,
  //     total_annotations: cocoData.annotations.length,
  //     categories: cocoData.categories,
  //     data: cocoData,
  //     download_url: null, // Frontend sẽ tạo blob download
  //   };
  // }

  /**
   * Helper: Get annotations for export
   */
  private async getAnnotationsForExport(dto: ExportAnnotationsDto) {
    const query = this.imageAnnotationRepo
      .createQueryBuilder('ann')
      .leftJoinAndSelect('ann.image', 'img')
      .where('ann.annotation_source = :source', {
        source: AnnotationSource.HUMAN,
      })
      .andWhere('ann.annotation_status = :status', {
        status: AnnotationStatus.APPROVED,
      });

    if (dto.project_id) {
      // Export by project
      query
        .innerJoin(
          'annotation_project_images',
          'pi',
          'pi.image_id = ann.image_id',
        )
        .andWhere('pi.project_id = :projectId', { projectId: dto.project_id });
    } else if (dto.image_ids && dto.image_ids.length > 0) {
      // Export by image IDs
      query.andWhere('ann.image_id IN (:...imageIds)', {
        imageIds: dto.image_ids,
      });
    }

    query.orderBy('ann.image_id', 'ASC');

    return await query.getMany();
  }

  /**
   * EXPORT ANNOTATIONS - YOLO FORMAT
   */
  async exportYOLO(dto: ExportAnnotationsDto) {
    const annotations = await this.getAnnotationsForExport(dto);

    if (annotations.length === 0) {
      throw new NotFoundException('No annotations found to export');
    }

    // Map classes
    const classMap = new Map<string, number>();
    let classId = 0;

    // Result: { filename: "labels content" }
    const yoloFiles: Record<string, string> = {};

    for (const ann of annotations) {
      const fileName = ann.image?.file_name || `image_${ann.image_id}.png`;
      const txtFileName = fileName.replace(/\.(png|jpg|jpeg)$/i, '.txt');

      const boxes = Array.isArray(ann.annotation_data)
        ? ann.annotation_data
        : [];
      const lines: string[] = [];

      // Get image dimensions (default 1024x1024 if not available)
      const imgWidth = ann.image?.image_width || 1024;
      const imgHeight = ann.image?.image_height || 1024;

      for (const box of boxes) {
        const className = box.class?.name || 'unknown';

        // Add class if not exists
        if (!classMap.has(className)) {
          classMap.set(className, classId);
          classId++;
        }

        const classIdx = classMap.get(className);
        const bbox = box.bbox || {};

        // Convert to YOLO format (normalized)
        // YOLO: <class_id> <x_center> <y_center> <width> <height>
        const x1 = bbox.x1 || 0;
        const y1 = bbox.y1 || 0;
        const x2 = bbox.x2 || 0;
        const y2 = bbox.y2 || 0;

        const xCenter = (x1 + x2) / 2 / imgWidth;
        const yCenter = (y1 + y2) / 2 / imgHeight;
        const width = (x2 - x1) / imgWidth;
        const height = (y2 - y1) / imgHeight;

        // Format: class x_center y_center width height
        lines.push(
          `${classIdx} ${xCenter.toFixed(6)} ${yCenter.toFixed(6)} ${width.toFixed(6)} ${height.toFixed(6)}`,
        );
      }

      yoloFiles[txtFileName] = lines.join('\n');
    }

    // Create classes.txt
    const classesList = Array.from(classMap.entries())
      .sort((a, b) => a[1] - b[1])
      .map(([name]) => name);

    yoloFiles['classes.txt'] = classesList.join('\n');

    // Create data.yaml
    yoloFiles['data.yaml'] = [
      '# YOLO Dataset Configuration',
      `# Generated: ${new Date().toISOString()}`,
      '',
      'names:',
      ...classesList.map((name, idx) => `  ${idx}: ${name}`),
      '',
      `nc: ${classesList.length}  # number of classes`,
    ].join('\n');

    return {
      format: 'YOLO',
      total_images: Object.keys(yoloFiles).length - 2, // Trừ classes.txt và data.yaml
      total_classes: classesList.length,
      classes: classesList,
      files: yoloFiles,
      download_url: null,
    };
  }
}
