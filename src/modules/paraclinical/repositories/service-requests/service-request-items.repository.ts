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

  async createServiceRequestItem(
    requestId: string,
    serviceId: number,
    manager?: EntityManager,
  ): Promise<ServiceRequestItem> {
    const db = manager || this.repository.manager;

    const item = db.create(ServiceRequestItem, {
      request_id: requestId,
      service_id: serviceId,
    });

    return db.save(item);
  }

  async findItemsByServiceRequestId(
    requestId: string,
    manager?: EntityManager,
  ): Promise<ServiceRequestItem[]> {
    const db = manager || this.repository.manager;
    const items = await db.find(ServiceRequestItem, {
      where: { request_id: requestId },
      relations: ['service'],
    });
    return items;
  }

  async findItemByServiceRequestItemId(
    itemId: string,
    manager?: EntityManager,
  ): Promise<ServiceRequestItem | null> {
    const db = manager || this.repository.manager;
    const item = await db.findOne(ServiceRequestItem, {
      where: { item_id: itemId },
      relations: ['service'],
    });
    return item;
  }

  async deleteServiceRequestItem(
    item: ServiceRequestItem,
    manager?: EntityManager,
  ) {
    const db = manager || this.repository.manager;
    return await db.remove(item);
  }

  async findServiceRequestItemsByEncounterId(
    encounter_id: string,
    manager?: EntityManager,
  ) {
    const db = manager || this.repository.manager;
    return await db
      .createQueryBuilder(ServiceRequestItem, 'item')
      .leftJoinAndSelect('item.service', 'service')
      .leftJoinAndSelect('item.request', 'request')
      .where('request.encounter_id = :encounter_id', { encounter_id })
      .andWhere('request.deleted_at IS NULL')
      .getMany();
  }
}
