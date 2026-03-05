import { IsInt, IsString, IsOptional, IsEnum, IsNumber } from 'class-validator';

export class CreateServiceDto {
  @IsOptional()
  @IsInt()
  category_id?: number;

  @IsString()
  service_name: string;

  @IsOptional()
  @IsNumber()
  unit_price?: number;
}