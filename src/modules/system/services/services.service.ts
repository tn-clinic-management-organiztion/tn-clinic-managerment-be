import { ServiceCategoriesRepository } from './../repositories/service-category.repository';
import { ServicesRepository } from './../repositories/service.repository';
import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, EntityManager } from 'typeorm';
import { RefService } from 'src/database/entities/service/ref_services.entity';
import { RefServiceCategory } from 'src/database/entities/service/ref_service_categories.entity';
import { CreateServiceDto } from 'src/modules/system/dto/service/service/create-service.dto';
import { QueryServiceDto } from 'src/modules/system/dto/service/service/query-service.dto';
import { UpdateServiceDto } from 'src/modules/system/dto/service/service/update-service.dto';
import { CreateCategoryDto } from 'src/modules/system/dto/service/service-category/create-category.dto';
import { QueryCategoryDto } from 'src/modules/system/dto/service/service-category/query-category.dto';
import { UpdateCategoryDto } from 'src/modules/system/dto/service/service-category/update-category.dto';
import { LinkRoomServiceDto } from 'src/modules/system/dto/service/service/link-room-service.dto';

@Injectable()
export class ServicesService {
  constructor(
    private readonly servicesRepository: ServicesRepository,
    private readonly serviceCategoriesRepository: ServiceCategoriesRepository,
    @InjectDataSource()
    private dataSource: DataSource,
  ) {}

  // ==================== SERVICES ====================
  async createService(
    dto: CreateServiceDto,
    manager?: EntityManager,
  ): Promise<RefService> {
    const execute = async (mgr: EntityManager) => {
      return await this.servicesRepository.createService(dto, mgr);
    };

    if (manager) {
      return await execute(manager);
    } else {
      return this.dataSource.transaction(async (newManager) => {
        return await execute(newManager);
      });
    }
  }

  async findAllServices(query: QueryServiceDto, manager?: EntityManager) {
    const execute = async (mgr: EntityManager) => {
      return this.servicesRepository.findAllServices(query, mgr);
    };
    let fullService;
    if (manager) {
      fullService = await execute(manager);
    } else {
      fullService = await this.dataSource.transaction(async (newManager) => {
        return await execute(newManager);
      });
    }
    const [data, total] = fullService;
    const { page = 1, limit = 20 } = query;
    return {
      data,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOneService(
    id: number,
    manager?: EntityManager,
  ): Promise<RefService> {
    const execute = async (mgr: EntityManager) => {
      const service = await this.servicesRepository.findOneServiceById(id, mgr);
      if (!service) {
        throw new NotFoundException(`Service with ID ${id} not found`);
      }
      return service;
    };
    if (manager) {
      return await execute(manager);
    } else {
      return await this.dataSource.transaction(async (newManager) => {
        return await execute(newManager);
      });
    }
  }

  async updateService(
    id: number,
    dto: UpdateServiceDto,
    manager?: EntityManager,
  ): Promise<RefService> {
    const execute = async (mgr: EntityManager) => {
      const service = await this.servicesRepository.findOneServiceById(id, mgr);
      if (!service) {
        throw new NotFoundException(`Service with ID ${id} not found`);
      }
      return await this.servicesRepository.updateService(service, dto, mgr);
    };
    if (manager) {
      return await execute(manager);
    } else {
      return await this.dataSource.transaction(async (newManager) => {
        return await execute(newManager);
      });
    }
  }

  async removeService(id: number, manager?: EntityManager): Promise<void> {
    const execute = async (mgr: EntityManager) => {
      const service = await this.servicesRepository.findOneServiceById(id, mgr);
      if (!service) {
        throw new NotFoundException(`Service with ID ${id} not found`);
      }
      await this.servicesRepository.removeService(service, mgr);
    };

    if (manager) {
      await execute(manager);
    } else {
      await this.dataSource.transaction(async (newManager) => {
        await execute(newManager);
      });
    }
  }

  // ==================== CATEGORIES ====================
  // hàm này có 1 chỗ chưa sửa là khi có parent_id thì is_system_root của parent kia nếu đang true phải false
  async createCategory(
    dto: CreateCategoryDto,
    manager?: EntityManager,
  ): Promise<RefServiceCategory> {
    const execute = async (mgr: EntityManager) => {
      if (dto.parent_id) {
        const parentCategory =
          await this.serviceCategoriesRepository.findServiceCategoryById(
            dto.parent_id,
            mgr,
          );
        if (!parentCategory) {
          throw new NotFoundException(
            `Parent with ID ${dto.parent_id} not found`,
          );
        }
      }
      return await this.serviceCategoriesRepository.createServiceCategory(
        dto,
        mgr,
      );
    };
    if (manager) {
      return await execute(manager);
    } else {
      return this.dataSource.transaction(async (newManager) => {
        return await execute(newManager);
      });
    }
  }

  async findAllCategories(query: QueryCategoryDto, manager?: EntityManager) {
    const execute = async (mgr: EntityManager) => {
      return await this.serviceCategoriesRepository.findAllCategories(
        query,
        mgr,
      );
    };
    let result;
    if (manager) {
      result = await execute(manager);
    } else {
      result = await this.dataSource.transaction(async (newManager) => {
        return await execute(newManager);
      });
    }
    const [data, total] = result;
    const { page = 1, limit = 20, parent_id, is_system_root, search } = query;
    return {
      data,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOneCategory(
    id: number,
    manager?: EntityManager,
  ): Promise<RefServiceCategory> {
    const execute = async (mgr: EntityManager) => {
      const category = await this.serviceCategoriesRepository.findCategoryById(
        id,
        mgr,
      );
      if (!category) {
        throw new NotFoundException(`Category with ID ${id} not found`);
      }

      return category;
    };
    if (manager) {
      return await execute(manager);
    } else {
      return await this.dataSource.transaction(async (newManager) => {
        return await execute(newManager);
      });
    }
  }

  async getCategoryTree(manager?: EntityManager): Promise<any[]> {
    const execute = async (mgr: EntityManager) => {
      return this.serviceCategoriesRepository.getCategoryTree(mgr);
    };
    if (manager) {
      return await execute(manager);
    } else {
      return await this.dataSource.transaction(async (newManager) => {
        return await execute(newManager);
      });
    }
  }

  async updateCategory(
    id: number,
    dto: UpdateCategoryDto,
    manager?: EntityManager,
  ): Promise<RefServiceCategory> {
    const execute = async (mgr: EntityManager) => {
      const category = await this.serviceCategoriesRepository.findCategoryById(
        id,
        mgr,
      );
      if (!category) {
        throw new NotFoundException(`Category with ID ${id} not found`);
      }
      if (dto.parent_id) {
        if (id === dto.parent_id) {
          throw new BadRequestException(
            `Category with ID ${id} and Parent_id are the same`,
          );
        }
        let isLoop =
          await this.serviceCategoriesRepository.checkServiceCategoryLoop(
            id,
            dto.parent_id,
            mgr,
          );
        if (!isLoop) {
          throw new BadRequestException(
            `Category with ID ${id} and Parent_id are looped`,
          );
        }
      }
      return await this.serviceCategoriesRepository.updateCategory(
        category,
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

  async removeCategory(id: number, manager?: EntityManager) {
    const execute = async (mgr: EntityManager) => {
      const category = await this.serviceCategoriesRepository.findCategoryById(
        id,
        mgr,
      );
      if (!category) {
        throw new NotFoundException(`Category with ID ${id} not found`);
      }
      // Check if category has children
      const hasChildren =
        await this.serviceCategoriesRepository.countCategoryChild(id, mgr);
      if (hasChildren > 0) {
        throw new BadRequestException(
          'Cannot delete category with child categories',
        );
      }
      // Check if category has services
      const hasServices =
        await this.serviceCategoriesRepository.countServiceChild(id, mgr);

      if (hasServices > 0) {
        throw new BadRequestException('Cannot delete category with services');
      }
      return await this.serviceCategoriesRepository.removeCategory(category);
    };
    if (manager) {
      return await execute(manager);
    } else {
      return await this.dataSource.transaction(async (newManager) => {
        return await execute(newManager);
      });
    }
  }

  // ==================== ROOM-SERVICE LINKS ====================
  async linkRoomService(dto: LinkRoomServiceDto): Promise<void> {
    const { room_id, service_id } = dto;

    // Verify room exists
    const roomExists = await this.dataSource.query(
      `SELECT 1 FROM org_rooms WHERE room_id = $1 AND is_active = true`,
      [room_id],
    );

    if (!roomExists.length) {
      throw new NotFoundException(`Room with ID ${room_id} not found`);
    }

    // Verify service exists
    await this.findOneService(service_id);

    // Insert link
    await this.dataSource.query(
      `INSERT INTO room_services (room_id, service_id)
       VALUES ($1, $2)
       ON CONFLICT DO NOTHING`,
      [room_id, service_id],
    );
  }

  async unlinkRoomService(roomId: number, serviceId: number): Promise<void> {
    await this.dataSource.query(
      `DELETE FROM room_services 
       WHERE room_id = $1 AND service_id = $2`,
      [roomId, serviceId],
    );
  }

  async getRoomServices(roomId: number) {
    const services = await this.dataSource.query(
      `SELECT s.*, c.category_name
       FROM ref_services s
       LEFT JOIN ref_service_categories c ON s.category_id = c.category_id
       JOIN room_services rs ON s.service_id = rs.service_id
       WHERE rs.room_id = $1
       ORDER BY s.service_id`,
      [roomId],
    );

    return services;
  }

  async getServiceRooms(serviceId: number) {
    const rooms = await this.dataSource.query(
      `SELECT r.*
       FROM org_rooms r
       JOIN room_services rs ON r.room_id = rs.room_id
       WHERE rs.service_id = $1 AND r.is_active = true
       ORDER BY r.room_id`,
      [serviceId],
    );

    return rooms;
  }

  // ======================= Lọc những service được chỉ định
  async getAssignedServicesByEncounter(encounterId: string) {
    const rows = await this.dataSource.query(
      `
    WITH latest_ticket AS (
      -- Lấy ticket mới nhất của mỗi phòng
      SELECT DISTINCT ON (qt.room_id)
        qt.ticket_id,
        qt.room_id,
        qt.display_number,
        qt.status,
        qt.created_at
      FROM queue_tickets qt
      WHERE qt.encounter_id = $1
        AND qt.ticket_type = 'SERVICE'
      ORDER BY qt.room_id, qt.created_at DESC
    )
    SELECT
      lt.room_id,
      r.room_name,
      lt.display_number,
      lt.status,
      s.service_id,
      s.service_name,
      s.unit_price,
      s.category_id,
      c.category_name
    FROM latest_ticket lt
    JOIN ticket_service_items tsi ON tsi.ticket_id = lt.ticket_id
    JOIN service_request_items sri ON sri.item_id = tsi.item_id
    -- Lấy thông tin service
    JOIN ref_services s ON s.service_id = sri.service_id
    LEFT JOIN ref_service_categories c ON c.category_id = s.category_id
    LEFT JOIN org_rooms r ON r.room_id = lt.room_id
    ORDER BY lt.room_id, s.service_id;
    `,
      [encounterId],
    );

    // Group theo room
    const map = new Map<
      number,
      {
        room_id: number;
        room_name?: string;
        status?: string;
        display_number?: number;
        services: any[];
      }
    >();

    for (const row of rows) {
      const room_id = Number(row.room_id);

      if (!map.has(room_id)) {
        map.set(room_id, {
          room_id,
          room_name: row.room_name ?? undefined,
          status: row.status ?? undefined,
          display_number:
            row.display_number != null ? Number(row.display_number) : undefined,
          services: [],
        });
      }

      map.get(room_id)!.services.push({
        service_id: Number(row.service_id),
        service_name: row.service_name,
        unit_price: row.unit_price,
        category_id: row.category_id ?? null,
        category_name: row.category_name ?? null,
      });
    }

    const data = Array.from(map.values());
    const totalServices = rows.length;

    return {
      data,
      meta: {
        totalRooms: data.length,
        totalServices,
      },
    };
  }
}
