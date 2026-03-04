import { PageQueryDto } from 'src/modules/_shared/pagination';
import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { EncounterStatus } from 'src/database/entities/clinical/medical_encounters.entity';

export class QueryEncounterDto extends PageQueryDto {
  @IsOptional()
  @IsUUID()
  patient_id?: string;

  @IsOptional()
  @IsUUID()
  doctor_id?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  assigned_room_id?: number;

  @IsOptional()
  @IsEnum(EncounterStatus)
  current_status?: EncounterStatus;
}
