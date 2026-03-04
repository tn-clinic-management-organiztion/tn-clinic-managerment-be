import { PageQueryDto } from 'src/modules/_shared/pagination';
import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  IsArray,
  ArrayMinSize,
} from 'class-validator';
import { Type } from 'class-transformer';
import { PartialType } from '@nestjs/mapped-types';
import { RoomType } from 'src/database/entities/auth/org_rooms.entity';

export class CreateOrgRoomDto {
  @IsNotEmpty()
  @IsString()
  @MaxLength(100)
  room_name: string;

  @IsOptional()
  @IsEnum(RoomType)
  room_type?: RoomType;

  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  is_active?: boolean = true;
}

export class UpdateOrgRoomDto extends PartialType(CreateOrgRoomDto) {}

export class QueryOrgRoomDto extends PageQueryDto {
  @IsOptional()
  @IsEnum(RoomType)
  room_type?: RoomType;

  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  is_active?: boolean;
}

export class AssignServicesToRoomDto {
  @IsNotEmpty()
  @IsArray()
  @ArrayMinSize(1)
  @Type(() => Number)
  @IsInt({ each: true })
  service_ids: number[];
}
