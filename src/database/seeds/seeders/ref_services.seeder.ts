import { RefService } from './../../entities/service/ref_services.entity';
import { DataSource } from 'typeorm';
import servicesData from '../data/ref_services.data.json';

export class RefServiceSeeder {
  async run(dataSource: DataSource): Promise<void> {
    const serviceRepository = dataSource.getRepository(RefService);

    if ((await serviceRepository.count()) > 0) {
      console.log('Services already seeded, skipping...');
      return;
    }

    for (const serviceData of servicesData) {
      const servicePayload = {
        ...serviceData,
        category_id: serviceData.category_id ?? undefined,
        unit_price:
          serviceData.unit_price != undefined
            ? String(serviceData.unit_price)
            : undefined,
      };

      await serviceRepository
        .createQueryBuilder()
        .insert()
        .into(RefService)
        .values(servicePayload)
        .execute();
    }

    const maxId = Math.max(...servicesData.map((s) => s.service_id));
    await serviceRepository.query(
      `SELECT setval(pg_get_serial_sequence('ref_services', 'service_id'), $1, true)`,
      [maxId],
    );

    console.log(`Seeded ${servicesData.length} services`);
  }
}
