import { IsUUID, IsOptional, IsBoolean, IsString, IsInt } from 'class-validator';

export class CreateResultDto {
  @IsUUID()
  request_item_id: string;

  @IsUUID()
  technician_id: string;

  @IsOptional()
  @IsString()
  main_conclusion?: string;

  @IsOptional()
  @IsString()
  report_body_html?: string;

  @IsOptional()
  @IsBoolean()
  is_abnormal?: boolean;
}