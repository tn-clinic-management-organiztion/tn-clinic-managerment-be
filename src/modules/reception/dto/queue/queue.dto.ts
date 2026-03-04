import { QueueStatus, QueueSource, QueueTicketType } from './../../../../database/entities/reception/queue_tickets.entity';
import { PageQueryDto } from 'src/modules/_shared/pagination';
import {
  IsArray,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateTicketDto {
  @IsNotEmpty()
  @Type(() => Number)
  @IsInt()
  room_id: number;

  @IsNotEmpty()
  @IsEnum(QueueTicketType)
  ticket_type: QueueTicketType;

  @IsOptional()
  @IsUUID()
  encounter_id?: string | null;

  @IsOptional()
  @IsEnum(QueueSource)
  source?: QueueSource = QueueSource.WALKIN;

  @IsOptional()
  @IsArray()
  @Type(() => Number)
  @IsInt({ each: true })
  service_ids?: number[];
}

export class UpdateTicketDto {
  @IsOptional()
  @IsEnum(QueueStatus)
  status?: QueueStatus;
}

export class QueryTicketDto extends PageQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  room_id?: number;

  @IsOptional()
  @IsEnum(QueueTicketType)
  ticket_type?: QueueTicketType;

  @IsOptional()
  @IsEnum(QueueStatus)
  status?: QueueStatus;

  @IsOptional()
  @IsEnum(QueueSource)
  source?: QueueSource;

  @IsOptional()
  @IsUUID()
  encounter_id?: string;
}