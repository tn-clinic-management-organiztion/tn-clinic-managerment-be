import { IsUUID, IsString, IsOptional, IsArray, IsInt, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ServiceRequestItemDto {
  @ApiProperty({ description: 'ID của service', example: 123 })
  @IsInt()
  service_id: number;
}

export class CreateServiceRequestDto {
  @ApiProperty({ description: 'ID encounter (UUID)', example: 'f4a5c5a0-8b2d-4c6a-9f7d-a1b2c3d4e5f6' })
  @IsUUID()
  encounter_id: string;

  @ApiProperty({ description: 'ID bác sĩ yêu cầu (UUID)', example: 'a1b2c3d4-e5f6-7890-ab12-cd34ef56gh78' })
  @IsUUID()
  requesting_doctor_id: string;

  @ApiPropertyOptional({ description: 'Ghi chú bổ sung', example: 'Nhờ làm gấp' })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiProperty({
    type: [ServiceRequestItemDto],
    description: 'Danh sách dịch vụ yêu cầu',
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ServiceRequestItemDto)
  items: ServiceRequestItemDto[];
}