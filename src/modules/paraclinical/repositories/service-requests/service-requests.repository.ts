import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, EntityManager, IsNull } from 'typeorm';
import { ServiceRequest } from 'src/database/entities/service/service_requests.entity';
import { QueryServiceRequestDto } from 'src/modules/paraclinical/dto/service-requests/query-service-request.dto';
import { UpdateServiceRequestDto } from 'src/modules/paraclinical/dto/service-requests/update-service-request.dto';
import { ServiceRequestItem } from 'src/database/entities/service/service_request_items.entity';

@Injectable()
export class ServiceRequestsRepository {
  constructor(
    @InjectRepository(ServiceRequest)
    private readonly serviceRequestRepository: Repository<ServiceRequest>,
  ) {}

  async createServiceRequest(
    encounterId: string,
    requesting_doctor_id?: string,
    manager?: EntityManager,
  ): Promise<ServiceRequest> {
    const db = manager || this.serviceRequestRepository.manager;

    const request = db.create(ServiceRequest, {
      encounter_id: encounterId,
      requesting_doctor_id,
    });

    return db.save(request);
  }

  async findAllRequest(query: QueryServiceRequestDto, manager?: EntityManager) {
    const db = manager || this.serviceRequestRepository.manager;
    const {
      page = 1,
      limit = 20,
      encounter_id,
      requesting_doctor_id,
      created_from,
      created_to,
    } = query;

    const skip = (page - 1) * limit;
    const qb = db
      .createQueryBuilder(ServiceRequest, 'request')
      .leftJoinAndSelect('request.encounter', 'encounter')
      .leftJoinAndSelect('request.requesting_doctor', 'doctor')
      .where('request.deleted_at IS NULL');
    if (encounter_id) {
      qb.andWhere('request.encounter_id = :encounter_id', { encounter_id });
    }

    if (requesting_doctor_id) {
      qb.andWhere('request.requesting_doctor_id = :requesting_doctor_id', {
        requesting_doctor_id,
      });
    }

    if (created_from) {
      qb.andWhere('request.created_at >= :created_from', { created_from });
    }

    if (created_to) {
      qb.andWhere('request.created_at <= :created_to', { created_to });
    }

    qb.orderBy('request.created_at', 'DESC').skip(skip).take(limit);

    const [data, total] = await qb.getManyAndCount();
    return { data, total };
  }

  async findOneRequest(
    id: string,
    manager?: EntityManager,
  ): Promise<ServiceRequest | null> {
    const db = manager || this.serviceRequestRepository.manager;
    const request = await db.findOne<ServiceRequest>(ServiceRequest, {
      where: { request_id: id, deleted_at: IsNull() },
      relations: ['encounter', 'requesting_doctor'],
    });

    return request;
  }

  async updateServiceRequest(
    serviceRequest: ServiceRequest,
    dto: UpdateServiceRequestDto,
    manager?: EntityManager,
  ) {
    const db = manager || this.serviceRequestRepository.manager;
    Object.assign(serviceRequest, dto);
    return await db.save(serviceRequest);
  }

  async deleteServiceRequest(
    serviceRequest: ServiceRequest,
    manager?: EntityManager,
  ) {
    const db = manager || this.serviceRequestRepository.manager;
    return await db.softRemove(ServiceRequest, serviceRequest);
  }
}
