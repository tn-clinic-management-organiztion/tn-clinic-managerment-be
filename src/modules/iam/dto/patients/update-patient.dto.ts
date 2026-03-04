import { IsOptional, IsString, IsDateString, IsEnum, MaxLength, MinLength } from 'class-validator';
import { Gender } from './create-patient.dto';

export class UpdatePatientDto {
  @IsOptional()
  @IsString()
  @MaxLength(12)
  cccd?: string;

  @IsOptional()
  @IsString()
  full_name?: string;

  @IsOptional()
  @IsDateString()
  dob?: string;

  @IsOptional()
  @IsEnum(Gender)
  gender?: Gender;

  @IsOptional()
  @IsString()
  @MinLength(10)
  phone?: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsString()
  medical_history?: string;

  @IsOptional()
  @IsString()
  allergy_history?: string;
}