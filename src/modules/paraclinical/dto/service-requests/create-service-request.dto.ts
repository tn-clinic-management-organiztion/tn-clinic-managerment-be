import { IsUUID, IsString, IsOptional, IsArray, IsInt, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class ServiceRequestItemDto {
  @IsInt()
  service_id: number;
}

export class CreateServiceRequestDto {
  @IsUUID()
  encounter_id: string;

  @IsUUID()
  requesting_doctor_id: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ServiceRequestItemDto)
  items: ServiceRequestItemDto[];
}