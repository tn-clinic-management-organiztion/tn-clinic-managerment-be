import { ServiceRequestItem } from 'src/database/entities/service/service_request_items.entity';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, EntityManager } from 'typeorm';

@Injectable()
export class ServiceRequestItemsRepository {
  constructor(
    @InjectRepository(ServiceRequestItem)
    private readonly repository: Repository<ServiceRequestItem>,
  ) {}

  async createServiceRequestItem(requestId: number, serviceId: number, manager?: EntityManager): Promise<void> {
    const db = manager || this.repository.manager;
    
    await db.query(
      `
      INSERT INTO service_request_items (request_id, service_id)
      VALUES ($1, $2)
      `,
      [requestId, serviceId],
    );
  }

  async findItemsByServiceRequestId(requestId: string, manager?: EntityManager): Promise<ServiceRequestItem[]> {
    const db = manager || this.repository.manager;
    const items = await db.find(ServiceRequestItem, {
      where: { request_id: requestId },
      relations: ['service'],
    });
    return items;
  }
}