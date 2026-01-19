import { RefServiceCategory } from './../../entities/service/ref_service_categories.entity';
import { DataSource } from 'typeorm';
import refServiceCategoriesData from '../data/ref_service_categories.data.json';

export class RefServiceCategorySeeder {
  async run(dataSource: DataSource): Promise<void> {
    const refServiceCategoryRepository =
      dataSource.getRepository(RefServiceCategory);

    const count = await refServiceCategoryRepository.count();

    if (count > 0) {
      console.log('Service categories already seeded, skipping...');
      return;
    }

    const rootCategories = refServiceCategoriesData.filter(
      (c) => c.parent_id === null,
    );
    const childCategories = refServiceCategoriesData.filter(
      (c) => c.parent_id !== null,
    );

    // Insert ROOT categories
    for (const data of rootCategories) {
      await refServiceCategoryRepository
        .createQueryBuilder()
        .insert()
        .into(RefServiceCategory)
        .values(data)
        .execute();
    }

    // Insert CHILD categories
    for (const data of childCategories) {
      await refServiceCategoryRepository
        .createQueryBuilder()
        .insert()
        .into(RefServiceCategory)
        .values(data)
        .execute();
    }

    // Reset sequence về giá trị MAX(category_id) + 1
    const maxId = Math.max(
      ...refServiceCategoriesData.map((c) => c.category_id),
    );
    await dataSource.query(
      `SELECT setval(pg_get_serial_sequence('ref_service_categories', 'category_id'), $1, true)`,
      [maxId],
    );

    console.log(`Seeded ${refServiceCategoriesData.length} service categories`);
  }
}
