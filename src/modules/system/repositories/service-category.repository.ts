import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { RefServiceCategory } from 'src/database/entities/service/ref_service_categories.entity';
import { RefService } from 'src/database/entities/service/ref_services.entity';
import { CreateCategoryDto } from 'src/modules/system/dto/service/service-category/create-category.dto';
import { QueryCategoryDto } from 'src/modules/system/dto/service/service-category/query-category.dto';
import { UpdateCategoryDto } from 'src/modules/system/dto/service/service-category/update-category.dto';
import { EntityManager, Repository } from 'typeorm';

@Injectable()
export class ServiceCategoriesRepository {
  constructor(
    @InjectRepository(RefServiceCategory)
    private readonly serviceCategoriesRepository: Repository<RefServiceCategory>,
  ) {}

  // ======= Service Category
  async createServiceCategory(
    dto: CreateCategoryDto,
    manager?: EntityManager,
  ): Promise<RefServiceCategory> {
    const db = manager || this.serviceCategoriesRepository.manager;
    const category = db.create(RefServiceCategory, dto);
    return db.save(category);
  }

  async findServiceCategoryById(id: number, manager?: EntityManager) {
    const db = manager || this.serviceCategoriesRepository.manager;
    const category = db.findOne(RefServiceCategory, {
      where: { category_id: id },
      relations: ['parent'],
    });
    return category;
  }

  async findAllCategories(query: QueryCategoryDto, manager?: EntityManager) {
    const db = manager || this.serviceCategoriesRepository.manager;
    const { page = 1, limit = 20, parent_id, is_system_root, search } = query;
    const skip = (page - 1) * limit;
    const qb = db
      .createQueryBuilder(RefServiceCategory, 'category')
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

    return await qb.getManyAndCount();
  }

  async findCategoryById(id: number, manager?: EntityManager) {
    const db = manager || this.serviceCategoriesRepository.manager;
    return await db.findOne(RefServiceCategory, {
      where: { category_id: id },
      relations: ['parent'],
    });
  }

  async getCategoryTree(manager?: EntityManager) {
    const db = manager || this.serviceCategoriesRepository.manager;
    const categories = await db.find(RefServiceCategory, {
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

  async checkServiceCategoryLoop(
    category_id: number,
    newParent_id: number,
    manager?: EntityManager,
  ): Promise<boolean> {
    const db = manager || this.serviceCategoriesRepository.manager;
    const newParent = await db.findOne(RefServiceCategory, {
      where: { category_id: newParent_id },
    });
    if (newParent) {
      let currentParentId: number | null = newParent_id;
      while (currentParentId) {
        if (currentParentId === category_id) {
          return false;
        }
        const currentParent = await db.findOne(RefServiceCategory, {
          where: { category_id: currentParentId },
          select: ['parent_id'],
        });
        currentParentId = currentParent?.parent_id || null;
      }
    }
    return true;
  }

  async updateCategory(
    category: RefServiceCategory,
    dto: UpdateCategoryDto,
    manager?: EntityManager,
  ) {
    const db = manager || this.serviceCategoriesRepository.manager;
    Object.assign(category, dto);
    return await db.save(category);
  }

  async removeCateogry(category: RefServiceCategory, manager?: EntityManager) {
    const db = manager || this.serviceCategoriesRepository.manager;
    return await db.remove(category);
  }

  async countCategoryChild(parent_id: number, manager?: EntityManager) {
    const db = manager || this.serviceCategoriesRepository.manager;
    const hasChildren = await db.count(RefServiceCategory, {
      where: { parent_id: parent_id },
    });
    return hasChildren;
  }

  async countServiceChild(
    service_category_id: number,
    manager?: EntityManager,
  ) {
    const db = manager || this.serviceCategoriesRepository.manager;

    const count = await db
      .createQueryBuilder(RefServiceCategory, 'category')
      .leftJoin(
        RefService,
        'service',
        'service.service_category_id = category.category_id',
      )
      .where('category.category_id = :id', { id: service_category_id })
      .getCount();

    return count;
  }

  async removeCategory(category: RefServiceCategory, manager?: EntityManager) {
    const db = manager || this.serviceCategoriesRepository.manager;
    return await db.remove(category);
  }
}
