import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { RefServiceCategory } from 'src/database/entities/service/ref_service_categories.entity';
import { RefService } from 'src/database/entities/service/ref_services.entity';
import { CreateCategoryDto } from 'src/modules/system/dto/service/service-category/create-category.dto';
import { CreateServiceDto } from 'src/modules/system/dto/service/service/create-service.dto';
import { QueryServiceDto } from 'src/modules/system/dto/service/service/query-service.dto';
import { UpdateServiceDto } from 'src/modules/system/dto/service/service/update-service.dto';
import { EntityManager, Repository } from 'typeorm';

@Injectable()
export class ServicesRepository {
  constructor(
    @InjectRepository(RefService)
    private readonly servicesRepository: Repository<RefService>,
    @InjectRepository(RefServiceCategory)
    private readonly serviceCategoriesRepository: Repository<RefServiceCategory>,
  ) {}

  async createService(dto: CreateServiceDto, manager?: EntityManager) {
    const db = manager || this.servicesRepository.manager;
    const service = await db.create(RefService, {
      ...dto,
      unit_price: dto.unit_price ? String(dto.unit_price) : undefined,
    });
    return db.save(service);
  }

  async findAllServices(query: QueryServiceDto, manager?: EntityManager) {
    const db = manager || this.servicesRepository.manager;
    const { page = 1, limit = 20, category_id, search } = query;

    const skip = (page - 1) * limit;
    const qb = db
      .createQueryBuilder(RefService, 'service')
      .leftJoinAndSelect('service.category', 'category');

    if (category_id) {
      qb.andWhere('service.category_id = :category_id', { category_id });
    }

    if (search) {
      qb.andWhere('service.service_name ILIKE :search', {
        search: `%${search}%`,
      });
    }

    qb.orderBy('service.service_id', 'DESC').skip(skip).take(limit);

    return await qb.getManyAndCount();
  }

  async findOneServiceById(id: number, manager?: EntityManager) {
    const db = manager || this.servicesRepository.manager;
    return db.findOne(RefService, {
      where: { service_id: id },
      relations: ['category'],
    });
  }

  async updateService(
    service: RefService,
    dto: UpdateServiceDto,
    manager?: EntityManager,
  ) {
    const db = manager || this.servicesRepository.manager;
    Object.assign(service, {
      ...dto,
      unit_price: dto.unit_price ? String(dto.unit_price) : service.unit_price,
    });
    return await db.save(service);
  }

  async removeService(service: RefService, manager?: EntityManager) {
    const db = manager || this.servicesRepository.manager;
    return await db.remove(service);
  }
}
