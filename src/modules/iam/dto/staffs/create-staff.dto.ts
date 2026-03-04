import { IsNotEmpty, IsString, IsOptional, IsNumber, IsEmail, MinLength, MaxLength } from 'class-validator';

export class CreateStaffDto {
  @IsNotEmpty()
  @IsString()
  @MinLength(3)
  username: string;

  @IsNotEmpty()
  @IsString()
  @MinLength(6)
  password: string;

  @IsNotEmpty()
  @IsString()
  full_name: string;

  @IsNotEmpty()
  @IsNumber()
  role_id: number;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  @MaxLength(12)
  cccd?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsNumber()
  assigned_room_id?: number;

  @IsOptional()
  @IsNumber()
  specialty_id?: number;

  @IsOptional()
  @IsString()
  signature_url?: string;
}