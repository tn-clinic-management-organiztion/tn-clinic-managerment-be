import { IsOptional, IsUUID, IsEnum, IsDateString } from 'class-validator';
import { PageQueryDto } from 'src/modules/_shared/pagination';

export class QueryServiceRequestDto extends PageQueryDto {
  @IsOptional()
  @IsUUID()
  encounter_id?: string;

  @IsOptional()
  @IsUUID()
  requesting_doctor_id?: string;

  @IsOptional()
  @IsDateString()
  created_from?: string;

  @IsOptional()
  @IsDateString()
  created_to?: string;
}