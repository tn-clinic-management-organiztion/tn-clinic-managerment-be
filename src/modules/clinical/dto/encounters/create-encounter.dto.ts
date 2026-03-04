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

export class CreateEncounterDto {
  @IsNotEmpty()
  @IsUUID('all')
  patient_id: string;

  @IsOptional()
  @IsUUID()
  doctor_id?: string | null;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  assigned_room_id?: number | null;

  @IsOptional()
  @IsString()
  initial_symptoms?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  weight?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  height?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  bmi?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  temperature?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  pulse?: number; // Mạch

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  respiratory_rate?: number; // Nhịp thở

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  bp_systolic?: number; // Huyết áp tâm thu

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  bp_diastolic?: number; // Huyết áp tâm trương

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  sp_o2?: number; // SpO2
}