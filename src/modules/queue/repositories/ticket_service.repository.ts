import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { TicketServiceItem } from 'src/database/entities/service/ticket_service_items.entity';
import { CreateTicketServiceDto } from 'src/modules/queue/dto/ticket-service.dto';
import { EntityManager, Repository } from 'typeorm';

@Injectable()
export class TicketServiceRepository {
  constructor(
    @InjectRepository(TicketServiceItem)
    private readonly ticketServiceReposity: Repository<TicketServiceItem>,
  ) {}

  async createTicketService(
    dto: CreateTicketServiceDto,
    manager?: EntityManager,
  ) {
    console.log("createTicketService hehe")
    const db = manager || this.ticketServiceReposity.manager;
    const ticketService = db.create(TicketServiceItem, {
      ticket_id: dto.ticket_id,
      item_id: dto.item_id,
    });
    return db.save(ticketService);
  }

  async findTicketServiceByTicketId(
    ticket_id: string,
    manager?: EntityManager,
  ) {
    const db = manager || this.ticketServiceReposity.manager;
    const ticket = await db.findOne(TicketServiceItem, {
      where: { ticket_id: ticket_id },
    });
    return ticket;
  }
}
