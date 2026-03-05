import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  QueueSource,
  QueueStatus,
  QueueTicket,
  QueueTicketType,
} from 'src/database/entities/queue/queue_tickets.entity';
import {
  CreateTicketDto,
  QueryTicketDto,
  UpdateTicketDto,
} from 'src/modules/queue/dto/queue.dto';
import { EntityManager, Repository } from 'typeorm';

@Injectable()
export class QueueTicketsRepository {
  constructor(
    @InjectRepository(QueueTicket)
    private readonly queueTicketRepository: Repository<QueueTicket>,
  ) {}

  private startOfDay(d = new Date()) {
    const x = new Date(d);
    x.setHours(0, 0, 0, 0);
    return x;
  }

  async createQueueTicket(
    dto: CreateTicketDto,
    displayNumber: number,
    manager?: EntityManager,
  ) {
    const db = manager || this.queueTicketRepository.manager;
    const ticket = db.create(QueueTicket, {
      room_id: dto.room_id,
      ticket_type: dto.ticket_type,
      display_number: displayNumber,
      status: QueueStatus.WAITING,
      source: dto.source ?? QueueSource.WALKIN,

      // REGISTRATION luôn null encounter_id
      encounter_id:
        dto.ticket_type === QueueTicketType.REGISTRATION
          ? null
          : dto.encounter_id,
    });
    return db.save(ticket);
  }

  async findTicketById(ticketId: string, manager?: EntityManager) {
    const db = manager || this.queueTicketRepository.manager;
    return db.findOne(QueueTicket, {
      where: { ticket_id: ticketId },
      relations: ['room', 'encounter', 'encounter.patient'],
    });
  }

  async findAllTickets(query: QueryTicketDto, manager?: EntityManager) {
    const db = manager || this.queueTicketRepository.manager;
    const {
      page = 1,
      limit = 20,
      room_id,
      ticket_type,
      status,
      source,
      encounter_id,
    } = query;

    const skip = (page - 1) * limit;
    const qb = db
      .createQueryBuilder(QueueTicket, 'ticket')
      .leftJoinAndSelect('ticket.room', 'room')
      .leftJoinAndSelect('ticket.encounter', 'encounter')
      .leftJoinAndSelect('encounter.patient', 'patient');

    if (room_id) qb.andWhere('ticket.room_id = :room_id', { room_id });
    if (ticket_type)
      qb.andWhere('ticket.ticket_type = :ticket_type', { ticket_type });
    if (status) qb.andWhere('ticket.status = :status', { status });
    if (source) qb.andWhere('ticket.source = :source', { source });
    if (encounter_id)
      qb.andWhere('ticket.encounter_id = :encounter_id', { encounter_id });

    qb.orderBy('ticket.created_at', 'DESC').skip(skip).take(limit);

    return await qb.getManyAndCount();
  }

  async getTicketsByRoomToday(
    roomId: number,
    ticketType?: QueueTicketType,
    source?: QueueSource,
    manager?: EntityManager,
  ) {
    const db = manager || this.queueTicketRepository.manager;
    const today = this.startOfDay();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const qb = db
      .createQueryBuilder(QueueTicket, 'ticket')
      .leftJoinAndSelect('ticket.encounter', 'encounter')
      .leftJoinAndSelect('encounter.patient', 'enc_patient')
      .where('ticket.room_id = :roomId', { roomId })
      .andWhere('ticket.created_at >= :today', { today })
      .andWhere('ticket.created_at < :tomorrow', { tomorrow });

    if (source) qb.andWhere('ticket.source = :source', { source });
    if (ticketType)
      qb.andWhere('ticket.ticket_type = :ticketType', { ticketType });

    qb.orderBy('ticket.display_number', 'ASC');
    return qb.getMany();
  }

  async getTicketsByStatus(
    status: string, // "WAITING" | "CALLED" | "IN_PROGRESS" | "WAITING,CALLED"
    roomId: number,
    ticketType?: QueueTicketType,
    source?: QueueSource,
    manager?: EntityManager,
  ) {
    const db = manager || this.queueTicketRepository.manager;
    const statuses = status
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean) as QueueStatus[];

    const qb = db
      .createQueryBuilder(QueueTicket, 'ticket')
      .leftJoinAndSelect('ticket.encounter', 'encounter')
      .leftJoinAndSelect('encounter.patient', 'patient')
      .where('ticket.room_id = :roomId', { roomId });

    if (statuses.length === 1) {
      qb.andWhere('ticket.status = :status', { status: statuses[0] });
    } else {
      qb.andWhere('ticket.status IN (:...statuses)', { statuses });
    }

    if (source) qb.andWhere('ticket.source = :source', { source });
    if (ticketType)
      qb.andWhere('ticket.ticket_type = :ticketType', { ticketType });

    qb.orderBy('ticket.display_number', 'ASC');
    return qb.getMany();
  }

  async updateStatusTicket(
    ticketId: string,
    status: QueueStatus,
    manager?: EntityManager,
  ) {
    const db = manager || this.queueTicketRepository.manager;
    return await db.update(
      QueueTicket,
      { ticket_id: ticketId },
      { status, called_at: new Date() },
    );
  }

  async updateTicket(ticket: QueueTicket, dto: UpdateTicketDto, manager?: EntityManager) {
    const db = manager || this.queueTicketRepository.manager;
    Object.assign(ticket, dto);
    return await db.save(ticket);
  }
}
