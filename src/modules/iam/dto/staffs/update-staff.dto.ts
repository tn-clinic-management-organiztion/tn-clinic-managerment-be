import { IsOptional, IsString, IsEmail, IsNumber, MaxLength } from 'class-validator';

export class UpdateStaffDto {
  @IsOptional()
  @IsString()
  full_name?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  @MaxLength(12)
  cccd?: string;

  @IsOptional()
  @IsNumber()
  assigned_room_id?: number;

  @IsOptional()
  @IsNumber()
  specialty_id?: number;

  @IsOptional()
  @IsString()
  signature_url?: string;

  @IsOptional()
  @IsNumber()
  role_id?: number;

  @IsOptional()
  @IsString()
  password?: string; // Đổi mật khẩu
}