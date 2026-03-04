import { IsNotEmpty, IsString, IsOptional, IsDateString } from 'class-validator';

export class PatientRegisterDto {
  @IsOptional()
  @IsString()
  cccd?: string; // Không bắt buộc nữa

  @IsNotEmpty()
  @IsString()
  full_name: string;

  @IsNotEmpty()
  @IsDateString()
  dob: string;

  @IsNotEmpty()
  @IsString()
  gender: string;

  @IsNotEmpty()
  @IsString()
  phone: string; // Bắt buộc để làm identifier

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