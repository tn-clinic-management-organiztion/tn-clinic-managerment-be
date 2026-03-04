import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { RefIcd10 } from 'src/database/entities/clinical/ref_icd10.entity';
import { CreateIcd10Dto } from 'src/modules/system/dto/icd10/create-icd10.dto';
import { FilterIcd10Dto } from 'src/modules/system/dto/icd10/filter-icd10.dto';
import { UpdateIcd10Dto } from 'src/modules/system/dto/icd10/update-icd10.dto';
import { EntityManager, ILike, Like, Repository } from 'typeorm';

@Injectable()
export class Icd10Repository {
  constructor(
    @InjectRepository(RefIcd10)
    private readonly icd10Repository: Repository<RefIcd10>,
  ) {}

  async checkIcd10Exists(
    icd10_code: string,
    manager?: EntityManager,
  ): Promise<boolean> {
    const db = manager || this.icd10Repository.manager;
    const icd10 = await db.exists(RefIcd10, {
      where: { icd_code: icd10_code },
    });
    return !!icd10;
  }

  async findParentIcd10(parent_code: string, manager?: EntityManager) {
    const db = manager || this.icd10Repository.manager;
    return await db.findOne(RefIcd10, {
      where: { icd_code: parent_code },
    });
  }

  async createIcd10(data: CreateIcd10Dto, manager?: EntityManager) {
    const db = manager || this.icd10Repository.manager;
    const newIcd10 = db.create(RefIcd10, { ...data, is_leaf: true });
    return await db.save(newIcd10);
  }

  async findAllIcd10s(
    query: FilterIcd10Dto,
    manager?: EntityManager,
  ): Promise<[RefIcd10[], number]> {
    const db = manager ?? this.icd10Repository.manager;

    const page = Math.max(1, Number(query.page ?? 1));
    const limit = Math.max(1, Number(query.limit ?? 10));
    const skip = (page - 1) * limit;

    const keyword = query.search?.trim();
    const where = keyword
      ? [
          { icd_code: ILike(`%${keyword}%`) },
          { name_vi: ILike(`%${keyword}%`) },
          { name_en: ILike(`%${keyword}%`) },
        ]
      : {};

    return db.findAndCount(RefIcd10, {
      where,
      order: { icd_code: 'ASC' },
      take: limit,
      skip,
    });
  }

  async findIcd10ByCode(code: string, manager?: EntityManager) {
    const db = manager || this.icd10Repository.manager;
    return await db.findOne(RefIcd10, {
      where: { icd_code: code },
    });
  }

  async findDetailIcd10(code: string, manager?: EntityManager) {
    const db = manager || this.icd10Repository.manager;
    return await db.findOne(RefIcd10, {
      where: { icd_code: code },
      relations: ['parent'],
    });
  }

  async findChildrenIcd10(code: string, manager?: EntityManager) {
    const db = manager || this.icd10Repository.manager;
    return await db.find(RefIcd10, {
      where: { parent_code: code },
      order: { icd_code: 'ASC' },
    });
  }
  // Parent is not child of code
  async checkIcd10Loop(
    code: string,
    newParentCode: string,
    manager?: EntityManager,
  ): Promise<boolean> {
    const db = manager || this.icd10Repository.manager;
    const newParent = await this.findIcd10ByCode(newParentCode, db);
    if (newParent) {
      let currentAncestorCode: string | null = newParentCode;
      while (currentAncestorCode) {
        if (currentAncestorCode === code) {
          return false;
        }
        const currentAncestor = await db.findOne(RefIcd10, {
          where: { icd_code: currentAncestorCode },
          select: ['parent_code'],
        });
        currentAncestorCode = currentAncestor?.parent_code || null;
      }
    }
    return true;
  }

  async updateIcd10(
    code: string,
    updateIcd10Dto: UpdateIcd10Dto,
    manager?: EntityManager,
  ) {
    const db = manager || this.icd10Repository.manager;
    const result = await db.update(
      RefIcd10,
      { icd_code: code },
      updateIcd10Dto,
    );
    return result;
  }

  async countChildrenIcd10(code: string, manager?: EntityManager) {
    const db = manager || this.icd10Repository.manager;
    return await db.count(RefIcd10, {
      where: { parent_code: code },
    });
  }

  async deleteIcd10(code: string, manager?: EntityManager) {
    const db = manager || this.icd10Repository.manager;
    return await db.delete(RefIcd10, { icd_code: code });
  }
}
