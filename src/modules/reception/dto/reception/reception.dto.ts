import {
  IsDateString,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
} from 'class-validator';
import { Gender } from 'src/database/entities/auth/patient_profiles.entity';

export class CreateInitialConsultantDto {
  @IsNotEmpty()
  @IsString()
  ticket_id: string;

  @IsOptional()
  @IsUUID()
  patient_id?: string;

  @IsOptional()
  @IsString()
  @MaxLength(12)
  cccd?: string;

  @IsNotEmpty()
  @IsString()
  full_name: string;

  @IsNotEmpty()
  @IsDateString()
  dob: string; // Format: YYYY-MM-DD

  @IsNotEmpty()
  @IsEnum(Gender)
  gender: Gender;

  @IsNotEmpty()
  @IsString()
  @MinLength(10)
  phone: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsString()
  medical_history?: string;

  @IsOptional()
  @IsString()
  allergy_history?: string;

  @IsNotEmpty()
  @IsInt()
  assigned_room_id: number;

  @IsNotEmpty()
  @IsInt()
  service_id: number;
}
