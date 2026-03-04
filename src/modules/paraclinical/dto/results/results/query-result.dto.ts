import { IsOptional, IsUUID, IsBoolean, IsDateString, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';
import { PageQueryDto } from 'src/modules/_shared/pagination';

export class QueryResultDto extends PageQueryDto {
  @IsOptional()
  @IsUUID()
  request_item_id?: string;

  @IsOptional()
  @IsUUID()
  technician_id?: string;

  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  is_abnormal?: boolean;

  @IsOptional()
  @IsDateString()
  result_time_from?: string;

  @IsOptional()
  @IsDateString()
  result_time_to?: string;
}