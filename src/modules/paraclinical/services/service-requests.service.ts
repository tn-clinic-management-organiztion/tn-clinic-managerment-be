import { QueuesService } from 'src/modules/queue/services/queue.service';
import { QueueTicketsRepository } from 'src/modules/queue/repositories/queue-tickets.repository';
import { ServicesRepository } from './../../system/repositories/service.repository';
import { StaffsRepository } from 'src/modules/iam/repositories/staffs.repository';
import { EncountersRepository } from 'src/modules/clinical/repositories/encounters.repository';
import { TicketServiceRepository } from 'src/modules/queue/repositories/ticket_service.repository';
import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, IsNull, EntityManager } from 'typeorm';
import { ServiceRequest } from 'src/database/entities/service/service_requests.entity';
import { ServiceRequestItem } from 'src/database/entities/service/service_request_items.entity';
import { ServiceRequestItemsRepository } from 'src/modules/paraclinical/repositories/service-requests/service-request-items.repository';
import { ServiceRequestsRepository } from 'src/modules/paraclinical/repositories/service-requests/service-requests.repository';
import { CreateServiceRequestDto } from 'src/modules/paraclinical/dto/service-requests/create-service-request.dto';
import { QueryServiceRequestDto } from 'src/modules/paraclinical/dto/service-requests/query-service-request.dto';
import { UpdateServiceRequestDto } from 'src/modules/paraclinical/dto/service-requests/update-service-request.dto';
import { UpdateRequestItemDto } from 'src/modules/paraclinical/dto/service-requests/update-request-item.dto';
import { CreateTicketServiceDto } from 'src/modules/queue/dto/ticket-service.dto';
import { CreateTicketDto } from 'src/modules/queue/dto/queue.dto';
import {
  QueueSource,
  QueueTicketType,
} from 'src/database/entities/queue/queue_tickets.entity';

@Injectable()
export class ServiceRequestsService {
  constructor(
    @InjectDataSource()
    private dataSource: DataSource,
    private serviceRequestsRepository: ServiceRequestsRepository,
    private serviceRequestItemsRepository: ServiceRequestItemsRepository,
    private encounterRepository: EncountersRepository,
    private staffsRepository: StaffsRepository,
    private servicesRepository: ServicesRepository,
    private queuesService: QueuesService,
    private ticketServiceRepository: TicketServiceRepository,
  ) {}

  async createRequest(
    dto: CreateServiceRequestDto,
    manager?: EntityManager,
  ): Promise<ServiceRequest> {
    const execute = async (mgr: EntityManager) => {
      // 1. Verify encounter
      const encounter = await this.encounterRepository.findById(
        dto.encounter_id,
        mgr,
      );
      if (!encounter) {
        throw new NotFoundException('Encounter not found');
      }

      // 2. Verify doctor
      const doctor = await this.staffsRepository.findById(
        dto.requesting_doctor_id,
        mgr,
      );
      if (!doctor) {
        throw new NotFoundException('Doctor not found');
      }

      // 3. Create service_request (header)
      const request = await this.serviceRequestsRepository.createServiceRequest(
        dto.encounter_id,
        dto.requesting_doctor_id,
        mgr,
      );

      if (!dto.items || dto.items.length === 0) {
        return request;
      }

      // 4. Verify all services exist
      const serviceIds = dto.items.map((item) => item.service_id);
      for (const serviceId of serviceIds) {
        const service = await this.servicesRepository.findOneServiceById(
          serviceId,
          mgr,
        );
        if (!service) {
          throw new NotFoundException(`Service ${serviceId} not found`);
        }
      }

      // 5. GROUP services by room
      const roomToServiceIds = new Map<number, number[]>();

      for (const serviceId of serviceIds) {
        // Tìm tất cả phòng có thể làm dịch vụ này
        const rooms = await mgr
          .getRepository('room_services')
          .createQueryBuilder('rs')
          .where('rs.service_id = :serviceId', { serviceId })
          .getMany();

        if (!rooms || rooms.length === 0) {
          throw new BadRequestException(
            `Service ${serviceId} is not assigned to any room`,
          );
        }

        const selectedRoom = rooms[0];
        const roomId = selectedRoom.room_id;

        if (!roomToServiceIds.has(roomId)) {
          roomToServiceIds.set(roomId, []);
        }
        roomToServiceIds.get(roomId)!.push(serviceId);
      }

      // 6. create service_request_items (tất cả items trước)
      const itemIdMap = new Map<number, string>(); // service_id → item_id

      for (const itemDto of dto.items) {
        const item =
          await this.serviceRequestItemsRepository.createServiceRequestItem(
            request.request_id,
            itemDto.service_id,
            mgr,
          );
        itemIdMap.set(itemDto.service_id, item.item_id);
      }

      // 7. Tạo 1 ticket/phòng và link items
      for (const [roomId, serviceIdsForRoom] of roomToServiceIds.entries()) {
        // Tạo queue_ticket
        const ticketPayload: CreateTicketDto = {
          room_id: roomId,
          ticket_type: QueueTicketType.SERVICE,
          encounter_id: dto.encounter_id,
          source: QueueSource.WALKIN,
        };

        const ticket = await this.queuesService.createTicket(
          ticketPayload,
          mgr,
        );

        // Link tất cả services của phòng này vào ticket
        for (const serviceId of serviceIdsForRoom) {
          const itemId = itemIdMap.get(serviceId);
          if (!itemId) continue;

          await this.ticketServiceRepository.createTicketService(
            {
              ticket_id: ticket.ticket_id,
              item_id: itemId,
            },
            mgr,
          );
        }
      }

      return request;
    };

    if (manager) {
      return await execute(manager);
    } else {
      return await this.dataSource.transaction(async (newManager) => {
        return await execute(newManager);
      });
    }
  }

  async findAllRequests(
    query: QueryServiceRequestDto,
    manager?: EntityManager,
  ) {
    const execute = async (mgr: EntityManager) => {
      const { data, total } =
        await this.serviceRequestsRepository.findAllRequest(query, mgr);
      return {
        data,
        meta: {
          page: query.page || 1,
          limit: query.limit || 20,
          total,
          totalPages: Math.ceil(total / (query.limit || 20)),
        },
      };
    };
    if (manager) {
      return await execute(manager);
    } else {
      return await this.dataSource.transaction(async (newManager) => {
        return await execute(newManager);
      });
    }
  }

  async findOneRequest(
    id: string,
    manager?: EntityManager,
  ): Promise<ServiceRequest> {
    const execute = async (mgr: EntityManager) => {
      const request = await this.serviceRequestsRepository.findOneRequest(
        id,
        mgr,
      );
      if (!request) {
        throw new NotFoundException(`Service request with ID ${id} not found`);
      }
      return request;
    };
    if (manager) {
      return await execute(manager);
    } else {
      return await this.dataSource.transaction(async (newManager) => {
        return await execute(newManager);
      });
    }
  }

  async getRequestWithItems(id: string, manager?: EntityManager) {
    const execute = async (mgr: EntityManager) => {
      const request = await this.serviceRequestsRepository.findOneRequest(
        id,
        mgr,
      );

      const items =
        await this.serviceRequestItemsRepository.findItemsByServiceRequestId(
          id,
          mgr,
        );

      return {
        ...request,
        items: items,
      };
    };
    if (manager) {
      return await execute(manager);
    } else {
      return await this.dataSource.transaction(async (newManager) => {
        return await execute(newManager);
      });
    }
  }

  // Update (note) - Not done
  async updateRequest(
    id: string,
    dto: UpdateServiceRequestDto,
    manager?: EntityManager,
  ): Promise<ServiceRequest> {
    const execute = async (mgr: EntityManager) => {
      const request = await this.serviceRequestsRepository.findOneRequest(
        id,
        mgr,
      );
      if (!request) {
        throw new NotFoundException(`Service request with ID ${id} not found`);
      }
      return await this.serviceRequestsRepository.updateServiceRequest(
        request,
        dto,
        mgr,
      );
    };
    if (manager) {
      return await execute(manager);
    } else {
      return await this.dataSource.transaction(async (newManager) => {
        return await execute(newManager);
      });
    }
  }
  // Not done
  async removeRequest(id: string, manager?: EntityManager) {
    const execute = async (mgr: EntityManager) => {
      const request = await this.serviceRequestsRepository.findOneRequest(
        id,
        mgr,
      );
      if (!request) {
        throw new NotFoundException(`Service request with ID ${id} not found`);
      }
      return await this.serviceRequestsRepository.deleteServiceRequest(
        request,
        mgr,
      );
    };

    if (manager) {
      return await execute(manager);
    } else {
      return await this.dataSource.transaction(async (newManager) => {
        return await execute(newManager);
      });
    }
  }

  // ==================== REQUEST ITEMS ====================
  // Endpoint update item hiện không còn cập nhật trạng thái vì đã bỏ cột status.
  // Tạm thời chỉ trả về item (nếu tồn tại) để tránh breaking API.
  async updateRequestItem(
    itemId: string,
    _dto: UpdateRequestItemDto,
    manager?: EntityManager,
  ): Promise<ServiceRequestItem | null> {
    const execute = async (mgr: EntityManager) => {
      const item =
        await this.serviceRequestItemsRepository.findItemByServiceRequestItemId(
          itemId,
          mgr,
        );

      if (!item) {
        throw new NotFoundException(`Request item with ID ${itemId} not found`);
      }

      return item;
    };
    if (manager) {
      return await execute(manager);
    } else {
      return await this.dataSource.transaction(async (newManager) => {
        return await execute(newManager);
      });
    }
  }

  async removeRequestItem(
    itemId: string,
    manager?: EntityManager,
  ): Promise<void> {
    const execute = async (mgr: EntityManager) => {
      const item =
        await this.serviceRequestItemsRepository.findItemByServiceRequestItemId(
          itemId,
          mgr,
        );

      if (!item) {
        throw new NotFoundException(`Request item with ID ${itemId} not found`);
      }

      await this.serviceRequestItemsRepository.deleteServiceRequestItem(item);
    };

    if (manager) {
      return await execute(manager);
    } else {
      return await this.dataSource.transaction(async (newManager) => {
        return await execute(newManager);
      });
    }
  }

  async getRequestItemsByEncounter(
    encounterId: string,
    manager?: EntityManager,
  ) {
    const execute = async (mgr: EntityManager) => {
      return await this.serviceRequestItemsRepository.findServiceRequestItemsByEncounterId(
        encounterId,
        mgr,
      );
    };

    if (manager) {
      return await execute(manager);
    } else {
      return await this.dataSource.transaction(async (newMangaer) => {
        return await execute(newMangaer);
      });
    }
  }

  async getClsItemsByEncounter(encounterId: string) {
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
      ])
      .from('service_request_items', 'sri')
      .innerJoin('service_requests', 'sr', 'sri.request_id = sr.request_id')
      .innerJoin('ref_services', 's', 'sri.service_id = s.service_id')
      .leftJoin('ref_service_categories', 'c', 's.category_id = c.category_id')
      // ✅ Chỉ lấy items thuộc SERVICE tickets (không phải CONSULTATION)
      .innerJoin('ticket_service_items', 'tsi', 'tsi.item_id = sri.item_id')
      .innerJoin('queue_tickets', 'qt', 'qt.ticket_id = tsi.ticket_id')
      .where('sr.encounter_id = :encounterId', { encounterId })
      .andWhere('qt.ticket_type = :ticketType', { ticketType: 'SERVICE' })
      .andWhere('sr.deleted_at IS NULL')
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
      })),
      meta: {
        total: items.length,
      },
    };
  }

  // async getPendingItems(roomId?: number) {
  //   const qb = this.itemRepo
  //     .createQueryBuilder('item')
  //     .leftJoinAndSelect('item.service', 'service')
  //     .leftJoinAndSelect('item.request', 'request')
  //     .leftJoinAndSelect('request.encounter', 'encounter')
  //     .leftJoinAndSelect('encounter.patient', 'patient')
  //     .andWhere('request.deleted_at IS NULL');

  //   if (roomId) {
  //     qb.innerJoin(
  //       'room_services',
  //       'rs',
  //       'rs.service_id = service.service_id AND rs.room_id = :roomId',
  //       { roomId },
  //     );
  //   }

  //   return await qb.orderBy('request.created_at', 'ASC').getMany();
  // }
}
