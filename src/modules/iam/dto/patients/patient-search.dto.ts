import { IsOptional, IsString } from 'class-validator';

export class PatientSearchDto {
  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  full_name?: string;

  @IsOptional()
  @IsString()
  cccd?: string;
}