import { IsOptional, IsInt, IsBoolean } from 'class-validator';
import { Type } from 'class-transformer';
import { PageQueryDto } from 'src/modules/_shared/pagination';

export class QueryCategoryDto extends PageQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  parent_id?: number;

  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  is_system_root?: boolean;
}