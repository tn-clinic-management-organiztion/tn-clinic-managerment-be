import { IsNotEmpty, IsString, IsOptional, IsNumber, IsEmail, MinLength } from 'class-validator';

export class StaffRegisterDto {
  @IsNotEmpty()
  @IsString()
  @MinLength(3)
  username: string;

  @IsNotEmpty()
  @IsString()
  @MinLength(6)
  password: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  // Staff profile information
  @IsNotEmpty()
  @IsString()
  full_name: string;

  @IsNotEmpty()
  @IsNumber()
  role_id: number;

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