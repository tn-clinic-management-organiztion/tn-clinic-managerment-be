import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsUUID, IsEnum, IsDateString } from 'class-validator';
import { PageQueryDto } from 'src/modules/_shared/pagination';

export class QueryServiceRequestDto extends PageQueryDto {
  @ApiPropertyOptional({ description: 'Lọc theo ID encounter', type: String, format: 'uuid' })
  @IsOptional()
  @IsUUID()
  encounter_id?: string;

  @ApiPropertyOptional({ description: 'Lọc theo ID bác sĩ yêu cầu', type: String, format: 'uuid' })
  @IsOptional()
  @IsUUID()
  requesting_doctor_id?: string;

  @ApiPropertyOptional({ description: 'Ngày tạo từ', type: String, format: 'date-time' })
  @IsOptional()
  @IsDateString()
  created_from?: string;

  @ApiPropertyOptional({ description: 'Ngày tạo đến', type: String, format: 'date-time' })
  @IsOptional()
  @IsDateString()
  created_to?: string;
}