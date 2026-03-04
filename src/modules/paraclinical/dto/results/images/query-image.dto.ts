import { IsOptional, IsUUID, IsString, IsDateString } from 'class-validator';
import { PageQueryDto } from 'src/modules/_shared/pagination';

export class QueryResultImageDto extends PageQueryDto {
  @IsOptional()
  @IsUUID()
  result_id?: string;

  @IsOptional()
  @IsUUID()
  uploaded_by?: string;

  @IsOptional()
  @IsString()
  mime_type?: string;

  @IsOptional()
  @IsDateString()
  uploaded_from?: string;

  @IsOptional()
  @IsDateString()
  uploaded_to?: string;
}