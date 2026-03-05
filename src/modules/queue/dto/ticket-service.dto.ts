import { IsInt, IsNotEmpty, IsUUID } from 'class-validator';

export class CreateTicketServiceDto {
  @IsNotEmpty()
  @IsUUID()
  ticket_id: string;

  @IsNotEmpty()
  @IsUUID()
  item_id: string;
}
