import { PartialType } from '@nestjs/mapped-types';
import { Type } from 'class-transformer';
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
import { EncounterStatus } from 'src/database/entities/clinical/medical_encounters.entity';
import { CreateEncounterDto } from 'src/modules/clinical/dto/encounters/create-encounter.dto';


export class UpdateEncounterDto extends PartialType(CreateEncounterDto) {
  @IsOptional()
  @IsEnum(EncounterStatus)
  current_status?: EncounterStatus;

  @IsOptional()
  @IsString()
  @MaxLength(10)
  final_icd_code?: string | null;

  @IsOptional()
  @IsString()
  doctor_conclusion?: string;
}