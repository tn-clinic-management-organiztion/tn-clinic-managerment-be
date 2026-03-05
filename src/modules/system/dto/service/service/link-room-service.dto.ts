import { IsInt } from 'class-validator';

export class LinkRoomServiceDto {
  @IsInt()
  room_id: number;

  @IsInt()
  service_id: number;
}