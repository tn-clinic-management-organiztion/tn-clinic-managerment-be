import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, IsNull, EntityManager } from 'typeorm';
import { ServiceRequest } from 'src/database/entities/service/service_requests.entity';
import { ServiceRequestItem } from 'src/database/entities/service/service_request_items.entity';
import { ServiceRequestItemsRepository } from 'src/modules/paraclinical/repositories/service-requests/service-request-items.repository';
import { ServiceRequestsRepository } from 'src/modules/paraclinical/repositories/service-requests/service-requests.repository';
import { CreateServiceRequestDto } from 'src/modules/paraclinical/dto/service-requests/create-service-request.dto';
import { QueryServiceRequestDto } from 'src/modules/paraclinical/dto/service-requests/query-service-request.dto';
import { UpdateServiceRequestDto } from 'src/modules/paraclinical/dto/service-requests/update-service-request.dto';
import { UpdateRequestItemDto } from 'src/modules/paraclinical/dto/service-requests/update-request-item.dto';

@Injectable()
export class ServiceRequestsService {
  constructor(
    @InjectRepository(ServiceRequest)
    private requestRepo: Repository<ServiceRequest>,
    @InjectRepository(ServiceRequestItem)
    private itemRepo: Repository<ServiceRequestItem>,
    private dataSource: DataSource,
    private serviceRequestItemsRepository: ServiceRequestItemsRepository,
    private serviceRequestsRepository: ServiceRequestsRepository,
  ) {}

  async createRequest(dto: CreateServiceRequestDto): Promise<ServiceRequest> {
    return await this.dataSource.transaction(async (manager) => {
      // Verify encounter exists
      const encounterExists = await manager.query(
        `SELECT 1 FROM medical_encounters WHERE encounter_id = $1 AND deleted_at IS NULL`,
        [dto.encounter_id],
      );

      if (!encounterExists.length) {
        throw new NotFoundException('Encounter not found');
      }

      // Verify doctor exists
      const doctorExists = await manager.query(
        `SELECT 1 FROM staff_profiles WHERE staff_id = $1 AND deleted_at IS NULL`,
        [dto.requesting_doctor_id],
      );

      if (!doctorExists.length) {
        throw new NotFoundException('Doctor not found');
      }

      // Create request
      const request = manager.create(ServiceRequest, {
        encounter_id: dto.encounter_id,
        requesting_doctor_id: dto.requesting_doctor_id,
        notes: dto.notes,
      });

      const savedRequest = await manager.save(request);

      // Create items
      if (dto.items && dto.items.length > 0) {
        for (const itemDto of dto.items) {
          // Verify service exists
          const serviceExists = await manager.query(
            `SELECT 1 FROM ref_services WHERE service_id = $1`,
            [itemDto.service_id],
          );

          if (!serviceExists.length) {
            throw new NotFoundException(
              `Service with ID ${itemDto.service_id} not found`,
            );
          }

          const item = manager.create(ServiceRequestItem, {
            request_id: savedRequest.request_id,
            service_id: itemDto.service_id,
          });

          await manager.save(item);
        }
      }

      return savedRequest;
    });
  }

  /**
   * TẠO SERVICE REQUEST CHO DỊCH VỤ KHÁM BAN ĐẦU
   * Gọi ngay sau khi tạo Encounter
   */
  async createInitialConsultationRequest(
    encounterId: string,
    serviceId: number,
    manager?: EntityManager,
  ) {
    const execute = async (mgr: EntityManager) => {
      // Create service_request
      const serviceRequest =
        await this.serviceRequestsRepository.createServiceRequest(
          encounterId,
          mgr,
        );
      const requestId = serviceRequest[0].request_id;
      // Create service_request_item for initial consultation service
      await this.serviceRequestItemsRepository.createServiceRequestItem(
        requestId,
        serviceId,
        mgr,
      );

      return { request_id: requestId };
    };
    if (manager) {
      return await execute(manager);
    } else {
      return await this.dataSource.transaction(async (newManager) => {
        return await execute(newManager);
      });
    }
  }

  async findAllRequests(query: QueryServiceRequestDto) {
    const { data, total } =
      await this.serviceRequestsRepository.findAllRequest(query);
    return {
      data,
      meta: {
        page: query.page || 1,
        limit: query.limit || 20,
        total,
        totalPages: Math.ceil(total / (query.limit || 20)),
      },
    };
  }

  async findOneRequest(id: string): Promise<ServiceRequest> {
    const request = await this.serviceRequestsRepository.findOneRequest(id);
    if (!request) {
      throw new NotFoundException(`Service request with ID ${id} not found`);
    }
    return request;
  }

  async getRequestWithItems(id: string) {
    const request = await this.serviceRequestsRepository.findOneRequest(id);

    const items =
      await this.serviceRequestItemsRepository.findItemsByServiceRequestId(id);

    return {
      ...request,
      items: items,
    };
  }

  // Update (note) - Not done
  async updateRequest(
    id: string,
    dto: UpdateServiceRequestDto,
  ): Promise<ServiceRequest> {
    const request = await this.findOneRequest(id);
    Object.assign(request, dto);
    return await this.requestRepo.save(request);
  }
  // Not done
  async removeRequest(id: string): Promise<void> {
    const request = await this.findOneRequest(id);
    request.deleted_at = new Date();
    await this.requestRepo.save(request);
  }

  // ==================== REQUEST ITEMS ====================
  // Endpoint update item hiện không còn cập nhật trạng thái vì đã bỏ cột status.
  // Tạm thời chỉ trả về item (nếu tồn tại) để tránh breaking API.
  async updateRequestItem(
    itemId: string,
    _dto: UpdateRequestItemDto,
  ): Promise<ServiceRequestItem> {
    const item = await this.itemRepo.findOne({
      where: { item_id: itemId },
      relations: ['service'],
    });

    if (!item) {
      throw new NotFoundException(`Request item with ID ${itemId} not found`);
    }

    return item;
  }

  async removeRequestItem(itemId: string): Promise<void> {
    const item = await this.itemRepo.findOne({
      where: { item_id: itemId },
    });

    if (!item) {
      throw new NotFoundException(`Request item with ID ${itemId} not found`);
    }

    await this.itemRepo.remove(item);
  }

  async getRequestItemsByEncounter(encounterId: string) {
    return await this.itemRepo
      .createQueryBuilder('item')
      .leftJoinAndSelect('item.service', 'service')
      .leftJoinAndSelect('item.request', 'request')
      .where('request.encounter_id = :encounterId', { encounterId })
      .andWhere('request.deleted_at IS NULL')
      .getMany();
  }

  async getPendingItems(roomId?: number) {
    // Do đã bỏ trạng thái trên service_request_items, hàm này được chuyển
    // thành danh sách tất cả items còn hiệu lực (request chưa deleted).
    const qb = this.itemRepo
      .createQueryBuilder('item')
      .leftJoinAndSelect('item.service', 'service')
      .leftJoinAndSelect('item.request', 'request')
      .leftJoinAndSelect('request.encounter', 'encounter')
      .leftJoinAndSelect('encounter.patient', 'patient')
      .andWhere('request.deleted_at IS NULL');

    if (roomId) {
      qb.innerJoin(
        'room_services',
        'rs',
        'rs.service_id = service.service_id AND rs.room_id = :roomId',
        { roomId },
      );
    }

    return await qb.orderBy('request.created_at', 'ASC').getMany();
  }
}
