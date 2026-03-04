import { IsString, IsOptional, IsInt, IsBoolean } from 'class-validator';

export class CreateCategoryDto {
  @IsString()
  category_name: string;

  @IsOptional()
  @IsInt()
  parent_id?: number;

  @IsOptional()
  @IsBoolean()
  is_system_root?: boolean;
}