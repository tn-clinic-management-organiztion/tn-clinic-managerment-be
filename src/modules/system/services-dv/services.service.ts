import { CreateServiceDto } from './dto/services/create-service.dto';
import { UpdateServiceDto } from './dto/services/update-service.dto';
import { QueryServiceDto } from './dto/services/query-service.dto';
import { CreateCategoryDto } from './dto/categories/create-category.dto';
import { UpdateCategoryDto } from './dto/categories/update-category.dto';
import { QueryCategoryDto } from './dto/categories/query-category.dto';
import { LinkRoomServiceDto } from './dto/services/link-room-service.dto';
import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { RefService } from 'src/database/entities/service/ref_services.entity';
import { RefServiceCategory } from 'src/database/entities/service/ref_service_categories.entity';

@Injectable()
export class ServicesService {
  constructor(
    @InjectRepository(RefService)
    private serviceRepo: Repository<RefService>,
    @InjectRepository(RefServiceCategory)
    private categoryRepo: Repository<RefServiceCategory>,
    private dataSource: DataSource,
  ) {}

  // ==================== SERVICES ====================
  async createService(dto: CreateServiceDto): Promise<RefService> {
    const service = this.serviceRepo.create({
      ...dto,
      unit_price: dto.unit_price ? String(dto.unit_price) : undefined,
    });
    return await this.serviceRepo.save(service);
  }

  async findAllServices(query: QueryServiceDto) {
    const {
      page = 1,
      limit = 20,
      category_id,
      search,
    } = query;

    const skip = (page - 1) * limit;
    const qb = this.serviceRepo
      .createQueryBuilder('service')
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

    const [data, total] = await qb.getManyAndCount();

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

  async findOneService(id: number): Promise<RefService> {
    const service = await this.serviceRepo.findOne({
      where: { service_id: id },
      relations: ['category'],
    });

    if (!service) {
      throw new NotFoundException(`Service with ID ${id} not found`);
    }

    return service;
  }

  async updateService(id: number, dto: UpdateServiceDto): Promise<RefService> {
    const service = await this.findOneService(id);
    Object.assign(service, {
      ...dto,
      unit_price: dto.unit_price ? String(dto.unit_price) : service.unit_price,
    });
    return await this.serviceRepo.save(service);
  }

  async removeService(id: number): Promise<void> {
    const service = await this.findOneService(id);
    await this.serviceRepo.remove(service);
  }

  // ==================== CATEGORIES ====================
  async createCategory(dto: CreateCategoryDto): Promise<RefServiceCategory> {
    const category = this.categoryRepo.create(dto);
    return await this.categoryRepo.save(category);
  }

  async findAllCategories(query: QueryCategoryDto) {
    const { page = 1, limit = 20, parent_id, is_system_root, search } = query;
    const skip = (page - 1) * limit;
    const qb = this.categoryRepo
      .createQueryBuilder('category')
      .leftJoinAndSelect('category.parent', 'parent');
    if (parent_id !== undefined) {
      if (parent_id === null) {
        qb.andWhere('category.parent_id IS NULL');
      } else {
        qb.andWhere('category.parent_id = :parent_id', { parent_id });
      }
    }

    if (is_system_root !== undefined) {
      qb.andWhere('category.is_system_root = :is_system_root', {
        is_system_root,
      });
    }

    if (search) {
      qb.andWhere('category.category_name ILIKE :search', {
        search: `%${search}%`,
      });
    }

    qb.orderBy('category.category_id', 'ASC').skip(skip).take(limit);

    const [data, total] = await qb.getManyAndCount();

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

  async findOneCategory(id: number): Promise<RefServiceCategory> {
    const category = await this.categoryRepo.findOne({
      where: { category_id: id },
      relations: ['parent'],
    });

    if (!category) {
      throw new NotFoundException(`Category with ID ${id} not found`);
    }

    return category;
  }

  async getCategoryTree(): Promise<any[]> {
    const categories = await this.categoryRepo.find({
      relations: ['parent'],
      order: { category_id: 'ASC' },
    });

    const categoryMap = new Map();
    const tree: any[] = [];

    // Create map of all categories
    categories.forEach((cat) => {
      categoryMap.set(cat.category_id, { ...cat, children: [] });
    });

    // Build tree structure
    categories.forEach((cat) => {
      const node = categoryMap.get(cat.category_id);
      if (cat.parent_id) {
        const parent = categoryMap.get(cat.parent_id);
        if (parent) {
          parent.children.push(node);
        }
      } else {
        tree.push(node);
      }
    });

    return tree;
  }

  async updateCategory(
    id: number,
    dto: UpdateCategoryDto,
  ): Promise<RefServiceCategory> {
    const category = await this.findOneCategory(id);
    Object.assign(category, dto);
    return await this.categoryRepo.save(category);
  }

  async removeCategory(id: number): Promise<void> {
    const category = await this.findOneCategory(id);

    // Check if category has children
    const hasChildren = await this.categoryRepo.count({
      where: { parent_id: id },
    });

    if (hasChildren > 0) {
      throw new BadRequestException(
        'Cannot delete category with child categories',
      );
    }

    // Check if category has services
    const hasServices = await this.serviceRepo.count({
      where: { category_id: id },
    });

    if (hasServices > 0) {
      throw new BadRequestException('Cannot delete category with services');
    }

    await this.categoryRepo.remove(category);
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
    WITH tickets AS (
      SELECT
        qt.room_id,
        qt.display_number,
        qt.status,
        qt.service_ids,
        qt.created_at
      FROM queue_tickets qt
      WHERE qt.encounter_id = $1
        AND qt.ticket_type = 'SERVICE'
        AND qt.service_ids IS NOT NULL
    ),
    expanded AS (
      SELECT
        t.room_id,
        UNNEST(t.service_ids) AS service_id
      FROM tickets t
    ),
    latest_ticket AS (
      SELECT DISTINCT ON (t.room_id)
        t.room_id,
        t.display_number,
        t.status
      FROM tickets t
      ORDER BY t.room_id, t.created_at DESC
    )
    SELECT
      e.room_id,
      r.room_name,
      lt.display_number,
      lt.status,
      s.service_id,
      s.service_name,
      s.unit_price,
      s.category_id,
      c.category_name
    FROM expanded e
    JOIN ref_services s ON s.service_id = e.service_id
    LEFT JOIN ref_service_categories c ON c.category_id = s.category_id
    LEFT JOIN org_rooms r ON r.room_id = e.room_id
    LEFT JOIN latest_ticket lt ON lt.room_id = e.room_id
    ORDER BY e.room_id, s.service_id;
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
        unit_price: row.unit_price, // numeric -> string
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
