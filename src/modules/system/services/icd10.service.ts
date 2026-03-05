import { RefIcd10 } from '../../../database/entities/clinical/ref_icd10.entity';
import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { CreateIcd10Dto } from 'src/modules/system/dto/icd10/create-icd10.dto';
import { FilterIcd10Dto } from 'src/modules/system/dto/icd10/filter-icd10.dto';
import { UpdateIcd10Dto } from 'src/modules/system/dto/icd10/update-icd10.dto';
import { Icd10Repository } from 'src/modules/system/repositories/icd10.repository';
import { Like, DataSource, QueryFailedError } from 'typeorm';

@Injectable()
export class Icd10Service {
  constructor(
    private readonly icd10Repository: Icd10Repository,
    @InjectDataSource()
    private readonly dataSource: DataSource,
  ) {}

  async create(createIcd10Dto: CreateIcd10Dto): Promise<RefIcd10> {
    return this.dataSource.transaction(async (manager) => {
      const { icd_code, parent_code } = createIcd10Dto;

      // Basic validate
      if (parent_code && parent_code === icd_code) {
        throw new BadRequestException('parent_code cannot equal icd_code');
      }

      // Check duplicate (still keep it for nice message)
      const existing = await this.icd10Repository.checkIcd10Exists(
        icd_code,
        manager,
      );
      if (existing) {
        throw new ConflictException(`Mã ICD '${icd_code}' đã tồn tại.`);
      }

      // Prepare payload (avoid mutating dto)
      const payload: CreateIcd10Dto = { ...createIcd10Dto };

      // Parent logic
      if (parent_code) {
        const parent = await this.icd10Repository.findParentIcd10(
          parent_code,
          manager,
        );
        if (!parent) {
          throw new NotFoundException(`Mã cha '${parent_code}' không tồn tại.`);
        }

        // If parent is leaf -> set to non-leaf
        if (parent.is_leaf === true) {
          await manager.update(
            RefIcd10,
            { icd_code: parent.icd_code },
            { is_leaf: false },
          );
        }

        // Level auto
        const expectedLevel = (parent.level ?? 0) + 1;
        if (payload.level == null) {
          payload.level = expectedLevel;
        } else if (payload.level !== expectedLevel) {
          throw new BadRequestException(
            `level không hợp lệ. Level đúng phải là ${expectedLevel} (parent.level + 1).`,
          );
        }
      }

      // Default leaf (nếu DTO không set)
      if (payload.is_leaf == null) {
        payload.is_leaf = true;
      }

      try {
        return await this.icd10Repository.createIcd10(payload, manager);
      } catch (e) {
        // Unique violation fallback (Postgres)
        if (e instanceof QueryFailedError && (e as any).code === '23505') {
          throw new ConflictException(`Mã ICD '${icd_code}' đã tồn tại.`);
        }
        throw e;
      }
    });
  }

  // 2. LẤY DANH SÁCH CÓ PHÂN TRANG (PAGINATION & SEARCH)
  async findAll(query: FilterIcd10Dto) {
    return await this.dataSource.transaction(async (manager) => {
      const page = query.page || 1;
      const limit = query.limit || 10;
      const [result, total] = await this.icd10Repository.findAllIcd10s(
        query,
        manager,
      );

      const lastPage = Math.ceil(total / limit);
      const nextPage = page + 1 > lastPage ? null : page + 1;
      const prevPage = page - 1 < 1 ? null : page - 1;

      return {
        data: result,
        meta: {
          total,
          page,
          last_page: lastPage,
          next_page: nextPage,
          prev_page: prevPage,
        },
      };
    });
  }

  // 3. LẤY CHI TIẾT 1 BỆNH (FIND ONE)
  async findOne(code: string): Promise<RefIcd10> {
    return await this.dataSource.transaction(async (manager) => {
      const item = await this.icd10Repository.findDetailIcd10(code, manager);

      if (!item) {
        throw new NotFoundException(`Không tìm thấy ICD code: ${code}`);
      }
      return item;
    });
  }

  async findChildren(parentCode: string): Promise<RefIcd10[]> {
    return await this.dataSource.transaction(async (manager) => {
      const icdExists = await this.icd10Repository.checkIcd10Exists(
        parentCode,
        manager,
      );
      if (!icdExists) {
        throw new NotFoundException(`Không tìm thấy ICD code: ${parentCode}`);
      }
      return await this.icd10Repository.findChildrenIcd10(parentCode, manager);
    });
  }

  // 5. CẬP NHẬT (UPDATE) - ĐÃ TỐI ƯU VỚI CASCADE
  async update(
    code: string,
    updateIcd10Dto: UpdateIcd10Dto,
  ): Promise<RefIcd10> {
    return await this.dataSource.transaction(async (manager) => {
      // Get current node
      const currentNode = await this.icd10Repository.findIcd10ByCode(
        code,
        manager,
      );

      if (!currentNode) {
        throw new NotFoundException(`Không tìm thấy bệnh với mã: ${code}`);
      }

      // check duplicate icd_code (if update icd_code)
      if (updateIcd10Dto.icd_code && updateIcd10Dto.icd_code !== code) {
        const duplicate = await this.icd10Repository.checkIcd10Exists(
          updateIcd10Dto.icd_code,
          manager,
        );

        if (duplicate) {
          throw new ConflictException(
            `Mã ICD '${updateIcd10Dto.icd_code}' đã tồn tại.`,
          );
        }
        // Nhờ onUpdate: 'CASCADE' ở Entity, ta không cần lo về các con của node này.
        // DB sẽ tự động update parent_code của bọn con.
      }

      // B3: Xử lý khi thay đổi Cha (Di chuyển node sang nhóm khác)
      // Logic: Nếu có parent_code mới VÀ nó khác parent_code cũ
      if (
        updateIcd10Dto.parent_code !== undefined &&
        updateIcd10Dto.parent_code !== currentNode.parent_code
      ) {
        const oldParentCode = currentNode.parent_code;
        const newParentCode = updateIcd10Dto.parent_code;

        // --- A. XỬ LÝ CHA MỚI (Nơi chuyển đến) ---
        if (newParentCode) {
          // 1. Kiểm tra cha mới tồn tại không
          const newParent = await this.icd10Repository.findIcd10ByCode(
            newParentCode,
            manager,
          );

          if (!newParent) {
            throw new NotFoundException(
              `Mã cha mới '${newParentCode}' không tồn tại.`,
            );
          }

          // 2. Chống loop: Cha không thể là con của chính mình (hoặc chính mình)
          if (
            !(await this.icd10Repository.checkIcd10Loop(
              code,
              newParentCode,
              manager,
            ))
          ) {
            throw new ConflictException(
              'Lỗi cấu trúc: Không thể di chuyển một thư mục vào bên trong chính thư mục con/cháu của nó.',
            );
          }

          // 3. Update cha mới thành "Folder" (is_leaf = false)
          if (newParent.is_leaf) {
            await this.icd10Repository.updateIcd10(
              newParentCode,
              { is_leaf: false },
              manager,
            );
          }

          // 4. Tự động tính lại level cho node đang sửa
          updateIcd10Dto.level = (newParent.level || 0) + 1;
        } else {
          // Nếu newParentCode = null -> Chuyển thành Root (Cấp 1)
          updateIcd10Dto.level = 1;
        }

        // --- B. XỬ LÝ CHA CŨ ---
        if (oldParentCode) {
          const siblingsCount = await this.icd10Repository.countChildrenIcd10(oldParentCode, manager);
          // siblingsCount == 1 => move child => parent is leaf (transaction does not committed)
          if (siblingsCount <= 1) {
            await this.icd10Repository.updateIcd10(oldParentCode, { is_leaf: true }, manager);
          }
        }
      }

      // B4: Conduct updating
      // Do PK (icd_code) có thể bị thay đổi
      await this.icd10Repository.updateIcd10(code, updateIcd10Dto, manager);

      // B5: Trả về kết quả mới nhất
      const newCode = updateIcd10Dto.icd_code || code;
      const result = await this.icd10Repository.findIcd10ByCode(newCode, manager);

      if (!result) {
        throw new NotFoundException(
          `Lỗi hệ thống: Không tìm thấy bản ghi sau khi cập nhật.`,
        );
      }

      return result;
    });
  }

  // 6. XÓA (REMOVE) - CÓ KIỂM TRA RÀNG BUỘC & CẬP NHẬT CHA
  async remove(code: string) {
    return await this.dataSource.transaction(async (manager) => {
      // B1: Tìm node cần xóa để lấy thông tin (đặc biệt là parent_code)
      const nodeToDelete = await this.icd10Repository.findIcd10ByCode(code, manager);

      if (!nodeToDelete) {
        throw new NotFoundException(`Không tìm thấy ICD code: ${code}`);
      }

      // B2: Kiểm tra xem node này có con không?
      // Nếu còn con thì KHÔNG ĐƯỢC XÓA (User phải xóa con trước - "Xóa dần từ leaf lên")
      const childrenCount = await this.icd10Repository.countChildrenIcd10(code, manager);

      if (childrenCount > 0) {
        throw new ConflictException(
          `Không thể xóa '${code}' vì vẫn còn ${childrenCount} bệnh cấp dưới. Hãy xóa các bệnh con trước.`,
        );
      }

      // B3: Lưu lại parent_code trước khi xóa để tí nữa check
      const parentCode = nodeToDelete.parent_code;

      // B4: Tiến hành xóa node
      const result = await this.icd10Repository.deleteIcd10(code, manager);

      // B5: Cập nhật lại trạng thái của Node Cha (nếu có)
      if (parentCode) {
        // Đếm xem cha còn bao nhiêu con sau khi xóa node vừa rồi
        const remainingSiblings = await this.icd10Repository.countChildrenIcd10(parentCode, manager);

        // Nếu không còn con nào -> Cha trở thành Leaf
        if (remainingSiblings === 0) {
          await this.icd10Repository.updateIcd10(parentCode, { is_leaf: true }, manager);
        }
      }

      return result;
    });
  }
}
