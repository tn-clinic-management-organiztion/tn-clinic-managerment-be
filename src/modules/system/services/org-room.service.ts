import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, DataSource, In } from 'typeorm';
import { OrgRoom } from '../../../database/entities/auth/org_rooms.entity';
import { AssignServicesToRoomDto, CreateOrgRoomDto, QueryOrgRoomDto, UpdateOrgRoomDto } from 'src/modules/system/dto/org-room/org-room.dto';


@Injectable()
export class OrgRoomsService {
  constructor(
    @InjectRepository(OrgRoom)
    private readonly orgRoomRepo: Repository<OrgRoom>,
    private readonly dataSource: DataSource,
  ) {}

  async create(dto: CreateOrgRoomDto): Promise<OrgRoom> {
    const newRoom = this.orgRoomRepo.create(dto);
    return await this.orgRoomRepo.save(newRoom);
  }

  async findAll(query: QueryOrgRoomDto) {
    const { page = 1, limit = 20, search, room_type, is_active } = query;
    const skip = (page - 1) * limit;

    const qb = this.orgRoomRepo.createQueryBuilder('room');

    // Tìm kiếm theo tên phòng
    if (search) {
      qb.where('room.room_name ILIKE :search', { search: `%${search}%` });
    }

    // Lọc theo loại phòng
    if (room_type) {
      qb.andWhere('room.room_type = :room_type', { room_type });
    }

    // Lọc theo trạng thái
    if (is_active !== undefined) {
      qb.andWhere('room.is_active = :is_active', { is_active });
    }

    qb.orderBy('room.room_name', 'ASC');
    qb.skip(skip).take(limit);

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

  async findOne(id: number): Promise<OrgRoom> {
    const room = await this.orgRoomRepo.findOne({
      where: { room_id: id },
    });

    if (!room) {
      throw new NotFoundException(`Phòng với ID ${id} không tồn tại`);
    }

    return room;
  }

  async update(id: number, dto: UpdateOrgRoomDto): Promise<OrgRoom> {
    const room = await this.findOne(id);
    Object.assign(room, dto);
    return await this.orgRoomRepo.save(room);
  }

  async remove(id: number): Promise<void> {
    const room = await this.findOne(id);

    // Kiểm tra phòng có đang được sử dụng không
    const [
      encounterCount,
      queueTicketCount,
      staffCount,
    ] = await Promise.all([
      this.orgRoomRepo.manager
        .createQueryBuilder()
        .select('COUNT(*)', 'count')
        .from('medical_encounters', 'e')
        .where('e.assigned_room_id = :id', { id })
        .getRawOne(),
      this.orgRoomRepo.manager
        .createQueryBuilder()
        .select('COUNT(*)', 'count')
        .from('queue_tickets', 'qt')
        .where('qt.room_id = :id', { id })
        .getRawOne(),
      this.orgRoomRepo.manager
        .createQueryBuilder()
        .select('COUNT(*)', 'count')
        .from('staff_profiles', 'sp')
        .where('sp.assigned_room_id = :id', { id })
        .getRawOne(),
    ]);

    if (
      parseInt(encounterCount.count) > 0 ||
      parseInt(queueTicketCount.count) > 0 ||
      parseInt(staffCount.count) > 0
    ) {
      throw new ConflictException(
        'Không thể xóa phòng đang được sử dụng',
      );
    }

    const result = await this.orgRoomRepo.delete(id);

    if (result.affected === 0) {
      throw new NotFoundException(`Không tìm thấy phòng với ID ${id} để xóa`);
    }
  }

  async toggleActive(id: number): Promise<OrgRoom> {
    const room = await this.findOne(id);
    room.is_active = !room.is_active;
    return await this.orgRoomRepo.save(room);
  }

  // ==================== QUẢN LÝ SERVICES CỦA PHÒNG ====================

  async assignServices(
    roomId: number,
    dto: AssignServicesToRoomDto,
  ): Promise<void> {
    const room = await this.findOne(roomId);

    // Validate services tồn tại
    const services = await this.dataSource.manager
      .createQueryBuilder()
      .select('service_id')
      .from('ref_services', 's')
      .where('s.service_id IN (:...ids)', { ids: dto.service_ids })
      .getRawMany();

    if (services.length !== dto.service_ids.length) {
      throw new NotFoundException('Một số dịch vụ không tồn tại');
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Xóa tất cả services cũ của phòng
      await queryRunner.manager
        .createQueryBuilder()
        .delete()
        .from('room_services')
        .where('room_id = :roomId', { roomId })
        .execute();

      // Thêm services mới
      if (dto.service_ids.length > 0) {
        const values = dto.service_ids.map((serviceId) => ({
          room_id: roomId,
          service_id: serviceId,
        }));

        await queryRunner.manager
          .createQueryBuilder()
          .insert()
          .into('room_services')
          .values(values)
          .execute();
      }

      await queryRunner.commitTransaction();
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async getRoomServices(roomId: number): Promise<any[]> {
    await this.findOne(roomId); // Validate room exists

    return await this.dataSource.manager
      .createQueryBuilder()
      .select([
        's.service_id',
        's.service_name',
        's.unit_price',
        'sc.category_name',
      ])
      .from('room_services', 'rs')
      .innerJoin('ref_services', 's', 's.service_id = rs.service_id')
      .leftJoin('ref_service_categories', 'sc', 'sc.category_id = s.category_id')
      .where('rs.room_id = :roomId', { roomId })
      .orderBy('s.service_name', 'ASC')
      .getRawMany();
  }

  async removeService(roomId: number, serviceId: number): Promise<void> {
    await this.findOne(roomId); // Validate room exists

    const result = await this.dataSource.manager
      .createQueryBuilder()
      .delete()
      .from('room_services')
      .where('room_id = :roomId AND service_id = :serviceId', {
        roomId,
        serviceId,
      })
      .execute();

    if (result.affected === 0) {
      throw new NotFoundException(
        'Không tìm thấy dịch vụ trong phòng này',
      );
    }
  }

  async findRoomsByService(serviceId: number): Promise<OrgRoom[]> {
    return await this.orgRoomRepo
      .createQueryBuilder('room')
      .innerJoin('room_services', 'rs', 'rs.room_id = room.room_id')
      .where('rs.service_id = :serviceId', { serviceId })
      .andWhere('room.is_active = true')
      .orderBy('room.room_name', 'ASC')
      .getMany();
  }
}