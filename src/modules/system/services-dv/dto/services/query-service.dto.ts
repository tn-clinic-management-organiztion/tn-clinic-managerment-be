import { IsOptional, IsInt, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';
import { PageQueryDto } from 'src/modules/_shared/pagination';

export class QueryServiceDto extends PageQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  category_id?: number;
}