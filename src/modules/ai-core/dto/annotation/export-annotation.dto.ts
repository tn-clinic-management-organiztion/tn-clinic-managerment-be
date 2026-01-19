import { IsEnum, IsOptional, IsArray, IsUUID } from 'class-validator';

export enum ExportFormat {
  COCO = 'COCO',
  YOLO = 'YOLO',
}

export class ExportAnnotationsDto {
  // @IsEnum(ExportFormat)
  // format: ExportFormat;

  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  image_ids?: string[];

  @IsOptional()
  @IsUUID()
  project_id?: string;
}