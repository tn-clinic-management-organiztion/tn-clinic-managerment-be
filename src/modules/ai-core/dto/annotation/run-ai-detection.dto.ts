// src/modules/ai-core/dto/run-ai-detection.dto.ts
import { IsNotEmpty, IsUUID, IsOptional, IsNumber, IsString } from 'class-validator';

export class RunAiDetectionDto {
  @IsUUID()
  @IsNotEmpty()
  image_id: string;

  @IsString()
  @IsOptional()
  model_name?: string = 'yolov12n';

  @IsNumber()
  @IsOptional()
  confidence?: number = 0.25;
}