import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import { ServiceResult } from 'src/database/entities/service/service_results.entity';
import { ResultImage } from 'src/database/entities/service/result_images.entity';
import { CloudinaryService } from 'src/shared/cloudinary/cloudinary.service';
import { DataSource } from 'typeorm';
import { ImageAnnotation } from 'src/database/entities/ai/image_annotations.entity';
import { CreateResultDto } from 'src/modules/paraclinical/dto/results/results/create-result.dto';
import { QueryResultDto } from 'src/modules/paraclinical/dto/results/results/query-result.dto';
import { UpdateResultDto } from 'src/modules/paraclinical/dto/results/results/update-result.dto';
import { CreateResultImageDto } from 'src/modules/paraclinical/dto/results/images/create-image.dto';
import { BulkUploadImagesDto } from 'src/modules/paraclinical/dto/results/images/bulk-upload-image.dto';
import { QueryResultImageDto } from 'src/modules/paraclinical/dto/results/images/query-image.dto';
import { UpdateResultImageDto } from 'src/modules/paraclinical/dto/results/images/update-image.dto';
@Injectable()
export class ResultsService {
  constructor(
    @InjectRepository(ServiceResult)
    private resultRepo: Repository<ServiceResult>,
    @InjectRepository(ResultImage)
    private imageRepo: Repository<ResultImage>,
    private readonly cloudinaryService: CloudinaryService,
    @InjectDataSource()
    private readonly dataSource: DataSource,
  ) {}

  // ==================== SERVICE RESULTS ====================
  async createResult(dto: CreateResultDto): Promise<ServiceResult> {
    const result = this.resultRepo.create({
      request_item_id: dto.request_item_id,
      technician_id: dto.technician_id,
      main_conclusion: dto.main_conclusion,
      report_body_html: dto.report_body_html,
      is_abnormal: dto.is_abnormal ?? false,
    });

    return this.resultRepo.save(result);
  }

  async findAllResults(query: QueryResultDto) {
    const {
      page = 1,
      limit = 20,
      request_item_id,
      technician_id,
      is_abnormal,
      result_time_from,
      result_time_to,
    } = query;

    const skip = (page - 1) * limit;
    const qb = this.resultRepo
      .createQueryBuilder('result')
      .leftJoinAndSelect('result.request_item', 'item')
      .leftJoinAndSelect('result.technician', 'tech')
      .leftJoinAndSelect('result.images', 'image')
      .leftJoinAndSelect('image.annotations', 'ann')
      .where('result.deleted_at IS NULL');

    if (request_item_id) {
      qb.andWhere('result.request_item_id = :request_item_id', {
        request_item_id,
      });
    }

    if (technician_id) {
      qb.andWhere('result.technician_id = :technician_id', { technician_id });
    }

    if (is_abnormal !== undefined) {
      qb.andWhere('result.is_abnormal = :is_abnormal', { is_abnormal });
    }

    if (result_time_from) {
      qb.andWhere('result.result_time >= :from', {
        from: new Date(result_time_from),
      });
    }

    if (result_time_to) {
      qb.andWhere('result.result_time <= :to', {
        to: new Date(result_time_to),
      });
    }

    qb.orderBy('result.result_time', 'DESC').skip(skip).take(limit);

    const [data, total] = await qb.getManyAndCount();

    return {
      data,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOneResult(id: string): Promise<ServiceResult> {
    const result = await this.resultRepo.findOne({
      where: { result_id: id, deleted_at: IsNull() },
      relations: ['request_item', 'technician'],
    });

    if (!result) throw new NotFoundException(`Result with ID ${id} not found`);
    return result;
  }

  async updateResult(id: string, dto: UpdateResultDto): Promise<ServiceResult> {
    const result = await this.findOneResult(id);
    Object.assign(result, dto);
    return await this.resultRepo.save(result);
  }

  async removeResult(id: string): Promise<void> {
    const result = await this.findOneResult(id);
    result.deleted_at = new Date();
    await this.resultRepo.save(result);
  }

  // ==================== RESULT IMAGES ====================
  async createImage(dto: CreateResultImageDto): Promise<ResultImage> {
    try {
      const image = this.imageRepo.create({
        result_id: dto.result_id || null,
        original_image_url: dto.original_image_url,
        public_id: dto.public_id,
        file_name: dto.file_name,
        file_size: dto.file_size,
        mime_type: dto.mime_type,
        image_height: dto.image_height,
        image_width: dto.image_width,
        uploaded_by: dto.uploaded_by,
      });

      return await this.imageRepo.save(image);
    } catch (error) {
      if (error.code === '23503') {
        throw new BadRequestException('Result or Staff not found');
      }
      throw new InternalServerErrorException('Failed to create image');
    }
  }

  async uploadImageToCloudinary(
    file: Express.Multer.File,
    dto: CreateResultImageDto,
  ): Promise<ResultImage> {
    try {
      if (!file) {
        throw new BadRequestException('File is required');
      }

      const cloudImage = await this.cloudinaryService.uploadMedicalImage(file);

      const image = this.imageRepo.create({
        result_id: dto.result_id || null,
        uploaded_by: dto.uploaded_by,
        original_image_url: cloudImage.secure_url,
        public_id: cloudImage.public_id,
        file_name: file.originalname,
        file_size: String(file.size),
        image_height: dto.image_height,
        image_width: dto.image_width,
        mime_type: file.mimetype,
      });

      return await this.imageRepo.save(image);
    } catch (error) {
      if (error instanceof BadRequestException) throw error;
      if (error.code === '23503') {
        throw new BadRequestException('Result or Staff not found');
      }
      throw new InternalServerErrorException('Failed to upload image');
    }
  }

  async bulkUploadImages(
    files: Express.Multer.File[],
    dto: BulkUploadImagesDto,
  ): Promise<{
    uploaded: ResultImage[];
    failed: Array<{ index: number; reason: string }>;
  }> {
    if (!dto.images || dto.images.length !== files.length) {
      throw new BadRequestException('files and images length mismatch');
    }

    const uploaded: ResultImage[] = [];
    const failed: Array<{ index: number; reason: string }> = [];

    for (let i = 0; i < files.length; i++) {
      try {
        const image = await this.uploadImageToCloudinary(
          files[i],
          dto.images[i],
        );
        uploaded.push(image);
      } catch (e: any) {
        failed.push({ index: i, reason: e?.message ?? 'upload failed' });
      }
    }

    return { uploaded, failed };
  }

  async findAllImages(query: QueryResultImageDto) {
    const {
      page = 1,
      limit = 20,
      result_id,
      uploaded_by,
      mime_type,
      uploaded_from,
      uploaded_to,
    } = query;

    const skip = (page - 1) * limit;
    const qb = this.imageRepo
      .createQueryBuilder('image')
      .leftJoinAndSelect('image.result', 'result')
      .leftJoinAndSelect('image.uploader', 'uploader');

    if (result_id) {
      qb.andWhere('image.result_id = :result_id', { result_id });
    }

    if (uploaded_by) {
      qb.andWhere('image.uploaded_by = :uploaded_by', { uploaded_by });
    }

    if (mime_type) {
      qb.andWhere('image.mime_type = :mime_type', { mime_type });
    }

    if (uploaded_from) {
      qb.andWhere('image.uploaded_at >= :uploaded_from', { uploaded_from });
    }

    if (uploaded_to) {
      qb.andWhere('image.uploaded_at <= :uploaded_to', { uploaded_to });
    }

    qb.orderBy('image.uploaded_at', 'DESC').skip(skip).take(limit);

    const [data, total] = await qb.getManyAndCount();

    return {
      data,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOneImage(id: string): Promise<ResultImage> {
    const image = await this.imageRepo.findOne({
      where: { image_id: id },
      relations: ['result', 'uploader'],
    });

    if (!image) {
      throw new NotFoundException(`Image with ID ${id} not found`);
    }

    return image;
  }

  async updateImage(
    id: string,
    dto: UpdateResultImageDto,
  ): Promise<ResultImage> {
    const image = await this.findOneImage(id);
    Object.assign(image, dto);
    return await this.imageRepo.save(image);
  }

  async deleteImage(id: string): Promise<void> {
  await this.dataSource.transaction(async (manager) => {
    const resultImageRepo = manager.getRepository(ResultImage);
    const annotationRepo = manager.getRepository(ImageAnnotation);

    const image = await resultImageRepo.findOne({
      where: { image_id: id },
    });

    if (!image) {
      throw new NotFoundException(`Image (id: ${id}) not found`);
    }

    // 1. Delete annotations (DB)
    await annotationRepo.delete({ image_id: id });

    // 2. Delete image record (DB)
    await resultImageRepo.delete({ image_id: id });

    // 3. Delete (Cloudinary)
    if (image.public_id) {
      try {
        await this.cloudinaryService.deleteImage(image.public_id);
      } catch (err) {
        console.error("Cloudinary delete failed:", err);
        // KHÔNG throw 
      }
    }
  });
}

}
