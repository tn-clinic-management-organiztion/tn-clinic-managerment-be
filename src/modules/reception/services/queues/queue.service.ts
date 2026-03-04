import { EncountersRepository } from 'src/modules/clinical/repositories/encounters.repository';
import { QueueTicketsRepository } from './../../repositories/queue-tickets.repository';
import { QueueCountersRepository } from 'src/modules/reception/repositories/queue-counters.repository';
import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, EntityManager } from 'typeorm';
import {
  QueueTicket,
  QueueStatus,
  QueueSource,
  QueueTicketType,
} from '../../../../database/entities/reception/queue_tickets.entity';
import { QueueCounter } from '../../../../database/entities/reception/queue_counters.entity';
import {
  CreateTicketDto,
  UpdateTicketDto,
  QueryTicketDto,
} from '../../dto/queue/queue.dto';
import { RoomType } from '../../../../database/entities/auth/org_rooms.entity';
import { QueueGateway } from 'src/modules/reception/services/queues/queue.gateway';

@Injectable()
export class QueuesService {
  constructor(
    private readonly queueCountersRepository: QueueCountersRepository,
    private readonly queueTicketsRepository: QueueTicketsRepository,
    private readonly encountersRepository: EncountersRepository,
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
      throw new NotFoundException(`Failed to create or retrieve counter for room ${roomId}`);
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

      // Validate services if provided
      if (dto.service_ids?.length) {
        const services = await mrg
          .createQueryBuilder()
          .select('service_id')
          .from('ref_services', 's')
          .where('s.service_id IN (:...ids)', { ids: dto.service_ids })
          .getRawMany();

        if (services.length !== dto.service_ids.length) {
          throw new NotFoundException('Some services not found');
        }
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

      const newQueueTicket = await this.queueTicketsRepository.createQueueTicket(
        dto,
        displayNumber,
        mrg,
      );
      const detailNewQueueTicket = await this.queueTicketsRepository.findTicketById(newQueueTicket.ticket_id, mrg);
      if(!detailNewQueueTicket) {
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
