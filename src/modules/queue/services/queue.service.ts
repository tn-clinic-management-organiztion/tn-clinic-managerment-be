import { EncountersRepository } from 'src/modules/clinical/repositories/encounters.repository';
import { QueueTicketsRepository } from '../repositories/queue-tickets.repository';
import { QueueCountersRepository } from 'src/modules/queue/repositories/queue-counters.repository';
import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, EntityManager } from 'typeorm';
import {
  QueueTicket,
  QueueStatus,
  QueueSource,
  QueueTicketType,
} from '../../../database/entities/queue/queue_tickets.entity';
import { QueueCounter } from '../../../database/entities/queue/queue_counters.entity';
import {
  CreateTicketDto,
  UpdateTicketDto,
  QueryTicketDto,
} from '../dto/queue.dto';
import { RoomType } from '../../../database/entities/auth/org_rooms.entity';
import { QueueGateway } from 'src/modules/queue/services/queue.gateway';

@Injectable()
export class QueuesService {
  constructor(
    private readonly queueCountersRepository: QueueCountersRepository,
    private readonly queueTicketsRepository: QueueTicketsRepository,
    private readonly encountersRepository: EncountersRepository,
    @InjectDataSource()
    private readonly dataSource: DataSource,
    private readonly queueGateway: QueueGateway,
  ) {}

  private startOfDay(d = new Date()) {
    const x = new Date(d);
    x.setHours(0, 0, 0, 0);
    return x;
  }

  // ==================== COUNTER LOGIC ====================

  private async getOrCreateCounter(
    manager: EntityManager,
    roomId: number,
  ): Promise<QueueCounter> {
    const today = this.startOfDay();

    let counter =
      await this.queueCountersRepository.getCounterForRoomAndResetDate(
        roomId,
        today,
        manager,
        true,
      );
    if (!counter) {
      try {
        counter = await this.queueCountersRepository.createCounter(
          roomId,
          today,
          manager,
        );
      } catch (error) {
        counter =
          await this.queueCountersRepository.getCounterForRoomAndResetDate(
            roomId,
            today,
            manager,
            true,
          );
      }
    }
    if (!counter) {
      throw new NotFoundException(
        `Failed to create or retrieve counter for room ${roomId}`,
      );
    }
    return counter;
  }

  private async incrementCounter(
    manager: EntityManager,
    roomId: number,
    ticketType: QueueTicketType,
  ): Promise<number> {
    const counter = await this.getOrCreateCounter(manager, roomId);
    counter.last_number += 1;
    await manager.getRepository(QueueCounter).save(counter);
    return counter.last_number;
  }

  async cleanupOldCounters(): Promise<void> {
    const sevenDaysAgo = this.startOfDay();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    await this.queueCountersRepository.deleteOldCounters(sevenDaysAgo);
  }

  async getLastNumberOfRoomToday(id: number) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    let counter =
      await this.queueCountersRepository.getCounterForRoomAndResetDate(
        id,
        today,
      );

    if (!counter) {
      throw new NotFoundException(`Không tồn tại room có id: ${id}`);
    }
    return {
      last_number: counter.last_number,
    };
  }

  // ==================== TICKET LOGIC ====================

  async createTicket(
    dto: CreateTicketDto,
    manager?: EntityManager,
  ): Promise<QueueTicket> {
    const execute = async (mrg: EntityManager) => {
      // Validate room exists + active + get room_type
      const roomInfo = await mrg
        .createQueryBuilder()
        .select(['r.room_id as room_id', 'r.room_type as room_type'])
        .from('org_rooms', 'r')
        .where('r.room_id = :id', { id: dto.room_id })
        .andWhere('r.is_active = true')
        .getRawOne<{ room_id: number; room_type: RoomType }>();

      if (!roomInfo) throw new NotFoundException('Room không tìm thấy');

      // Validate encounter if provided
      if (dto.encounter_id) {
        const encounterExists =
          await this.encountersRepository.checkEncounterExists(
            dto.encounter_id,
            mrg,
          );

        if (!encounterExists)
          throw new NotFoundException('Encounter not found');
      }
      // Business rules
      if (dto.ticket_type === QueueTicketType.REGISTRATION) {
        // REGISTRATION must not include encounter_id
        if (dto.encounter_id !== undefined && dto.encounter_id !== null) {
          throw new BadRequestException(
            'REGISTRATION tickets must not include an encounter_id',
          );
        }
        // REGISTRATION must be created at CASHIER
        if (roomInfo.room_type !== RoomType.CASHIER) {
          throw new BadRequestException(
            'REGISTRATION tickets must be created at a CASHIER room',
          );
        }
      } else {
        // CONSULTATION/SERVICE: should have encounter_id
        if (!dto.encounter_id) {
          throw new BadRequestException(
            'CONSULTATION/SERVICE tickets must include an encounter_id',
          );
        }
      }
      const displayNumber = await this.incrementCounter(
        mrg,
        dto.room_id,
        dto.ticket_type,
      );

      const newQueueTicket =
        await this.queueTicketsRepository.createQueueTicket(
          dto,
          displayNumber,
          mrg,
        );
      const detailNewQueueTicket =
        await this.queueTicketsRepository.findTicketById(
          newQueueTicket.ticket_id,
          mrg,
        );
      if (!detailNewQueueTicket) {
        throw new NotFoundException('Tạo QueueTicket thất bại!');
      }
      return detailNewQueueTicket;
    };
    let fullTicket: QueueTicket;
    if (manager) {
      fullTicket = await execute(manager);
    } else {
      fullTicket = await this.dataSource.transaction(async (newManager) => {
        return await execute(newManager);
      });
    }
    if (fullTicket) {
      // Emit websocket event
      this.queueGateway.emitTicketCreated(dto.room_id, fullTicket);
    }
    return fullTicket;
  }

  async getItemsByTicketId(ticketId: string) {
    // Verify ticket exists
    const ticket = await this.queueTicketsRepository.findTicketById(ticketId);
    if (!ticket) {
      throw new NotFoundException('Ticket not found');
    }

    const items = await this.dataSource
      .createQueryBuilder()
      .select([
        'sri.item_id',
        'sri.request_id',
        'sri.service_id',
        's.service_name',
        's.unit_price',
        'c.category_id',
        'c.category_name',
        'COUNT(sr.result_id) as result_count',
      ])
      .from('ticket_service_items', 'tsi')
      .innerJoin('service_request_items', 'sri', 'tsi.item_id = sri.item_id')
      .innerJoin('ref_services', 's', 'sri.service_id = s.service_id')
      .leftJoin('ref_service_categories', 'c', 's.category_id = c.category_id')
      .leftJoin(
        'service_results',
        'sr',
        'sr.request_item_id = sri.item_id AND sr.deleted_at IS NULL',
      )
      .where('tsi.ticket_id = :ticketId', { ticketId })
      .groupBy(
        'sri.item_id, sri.request_id, sri.service_id, s.service_name, s.unit_price, c.category_id, c.category_name',
      )
      .getRawMany();

    return {
      data: items.map((row) => ({
        item_id: row.sri_item_id,
        request_id: row.sri_request_id,
        service_id: Number(row.sri_service_id),
        service_name: row.s_service_name,
        unit_price: row.s_unit_price,
        category_id: row.c_category_id ? Number(row.c_category_id) : null,
        category_name: row.c_category_name ?? null,
        has_result: Number(row.result_count) > 0,
      })),
      meta: {
        total: items.length,
      },
    };
  }

  async findAllTickets(query: QueryTicketDto) {
    return await this.dataSource.transaction(async (manager) => {
      const [data, total] = await this.queueTicketsRepository.findAllTickets(
        query,
        manager,
      );
      const { page = 1, limit = 20 } = query;
      return {
        data,
        meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
      };
    });
  }

  async getTicketById(ticket_id: string) {
    return await this.dataSource.transaction(async (manager) => {
      const fullTicket = await this.queueTicketsRepository.findTicketById(
        ticket_id,
        manager,
      );
      if (!fullTicket) {
        throw new NotFoundException(`Ticket with ID ${ticket_id} not found`);
      }
      return fullTicket;
    });
  }

  async getTodayTicketsByRoom(
    roomId: number,
    ticketType?: QueueTicketType,
    source?: QueueSource,
  ): Promise<QueueTicket[]> {
    return await this.dataSource.transaction(async (manager) => {
      return await this.queueTicketsRepository.getTicketsByRoomToday(
        roomId,
        ticketType,
        source,
        manager,
      );
    });
  }

  async getTicketsByStatus(
    status: string, // "WAITING" | "CALLED" | "IN_PROGRESS" | "WAITING,CALLED"
    roomId: number,
    ticketType?: QueueTicketType,
    source?: QueueSource,
  ): Promise<QueueTicket[]> {
    return await this.dataSource.transaction(async (manager) => {
      return await this.queueTicketsRepository.getTicketsByStatus(
        status,
        roomId,
        ticketType,
        source,
        manager,
      );
    });
  }

  async callSpecific(ticketId: string): Promise<QueueTicket> {
    const fullTicket = await this.dataSource.transaction(async (manager) => {
      const ticket = await this.queueTicketsRepository.findTicketById(
        ticketId,
        manager,
      );
      if (!ticket)
        throw new NotFoundException(`Ticket with ID ${ticketId} not found`);
      if (ticket.status !== QueueStatus.WAITING) {
        throw new BadRequestException('Only WAITING tickets can be called');
      }
      const saved = await this.queueTicketsRepository.updateStatusTicket(
        ticketId,
        QueueStatus.CALLED,
        manager,
      );
      return await this.queueTicketsRepository.findTicketById(
        ticketId,
        manager,
      );
    });
    if (!fullTicket) {
      throw new NotFoundException(`Ticket with ID ${ticketId} not found`);
    } else {
      // EMIT WEBSOCKET EVENT
      this.queueGateway.emitTicketCalled(fullTicket.room_id, fullTicket);
    }

    return fullTicket;
  }

  async startService(ticketId: string): Promise<QueueTicket> {
    const fullTicket = await this.dataSource.transaction(async (manager) => {
      const ticket = await this.queueTicketsRepository.findTicketById(
        ticketId,
        manager,
      );
      if (!ticket)
        throw new NotFoundException(`Ticket with ID ${ticketId} not found`);
      if (ticket.status !== QueueStatus.CALLED) {
        throw new BadRequestException('Only CALLED tickets can be started');
      }
      const saved = await this.queueTicketsRepository.updateStatusTicket(
        ticketId,
        QueueStatus.IN_PROGRESS,
        manager,
      );
      return await this.queueTicketsRepository.findTicketById(
        ticketId,
        manager,
      );
    });
    if (!fullTicket) {
      throw new NotFoundException(`Ticket with ID ${ticketId} not found`);
    } else {
      // EMIT WEBSOCKET EVENT
      this.queueGateway.emitTicketStarted(fullTicket.room_id, fullTicket);
    }

    return fullTicket;
  }

  async completeTicket(ticketId: string): Promise<QueueTicket> {
    const fullTicket = await this.dataSource.transaction(async (manager) => {
      const ticket = await this.queueTicketsRepository.findTicketById(
        ticketId,
        manager,
      );
      if (!ticket)
        throw new NotFoundException(`Ticket with ID ${ticketId} not found`);
      if (ticket.status !== QueueStatus.IN_PROGRESS) {
        throw new BadRequestException(
          'Only IN_PROGRESS tickets can be completed',
        );
      }
      const save = await this.queueTicketsRepository.updateStatusTicket(
        ticketId,
        QueueStatus.COMPLETED,
        manager,
      );
      return await this.queueTicketsRepository.findTicketById(
        ticketId,
        manager,
      );
    });
    if (!fullTicket) {
      throw new NotFoundException(`Ticket with ID ${ticketId} not found`);
    } else {
      // EMIT WEBSOCKET EVENT
      this.queueGateway.emitTicketCompleted(fullTicket.room_id, fullTicket);
    }
    return fullTicket;
  }

  async skipTicket(ticketId: string): Promise<QueueTicket> {
    const fullTicket = await this.dataSource.transaction(async (manager) => {
      const ticket = await this.queueTicketsRepository.findTicketById(
        ticketId,
        manager,
      );
      if (!ticket)
        throw new NotFoundException(`Ticket with ID ${ticketId} not found`);
      if (![QueueStatus.CALLED, QueueStatus.WAITING].includes(ticket.status)) {
        throw new BadRequestException(
          'Only CALLED or WAITING tickets can be skipped',
        );
      }
      await this.queueTicketsRepository.updateStatusTicket(
        ticketId,
        QueueStatus.SKIPPED,
        manager,
      );
      return await this.queueTicketsRepository.findTicketById(
        ticketId,
        manager,
      );
    });
    if (!fullTicket) {
      throw new NotFoundException(`Ticket with ID ${ticketId} not found`);
    } else {
      // EMIT WEBSOCKET EVENT
      this.queueGateway.emitTicketSkipped(fullTicket.room_id, fullTicket);
    }
    return fullTicket;
  }

  async update(id: string, dto: UpdateTicketDto): Promise<QueueTicket> {
    const fullTicket = await this.dataSource.transaction(async (manager) => {
      const ticket = await this.queueTicketsRepository.findTicketById(
        id,
        manager,
      );
      if (!ticket)
        throw new NotFoundException(`Ticket with ID ${id} not found`);
      const saved = await this.queueTicketsRepository.updateTicket(
        ticket,
        dto,
        manager,
      );
      return saved;
    });
    if (fullTicket) {
      this.queueGateway.emitTicketUpdated(fullTicket.room_id, fullTicket);
    }
    return fullTicket;
  }
}
