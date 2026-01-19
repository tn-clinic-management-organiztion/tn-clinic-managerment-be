// dto/create-ai-annotation.dto.ts
import { IsNotEmpty, IsUUID, IsOptional, IsString } from 'class-validator';

export class CreateAiAnnotationDto {
  @IsUUID()
  @IsNotEmpty()
  image_id: string;

  @IsOptional()
  detections?: any;

  @IsString()
  @IsOptional()
  model_name?: string = 'yolov12n';
}
