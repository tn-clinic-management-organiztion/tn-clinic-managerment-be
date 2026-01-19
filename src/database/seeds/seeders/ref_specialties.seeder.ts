import { RefSpecialty } from './../../entities/auth/ref_specialties.entity';
import { DataSource } from 'typeorm';
import specialtiesData from '../data/ref_specialties.data.json';

export class RefSpecialtySeeder {
  async run(dataSource: DataSource): Promise<void> {
    const refSpecialtyRepository = dataSource.getRepository(RefSpecialty);

    if ((await refSpecialtyRepository.count()) > 0) {
      console.log('Specialties already seeded, skipping...');
      return;
    }

    for (const specialtyData of specialtiesData) {
      const specialtyPayload = {
        ...specialtyData,
        description: specialtyData.description ?? undefined,
      };
      const speicalty = refSpecialtyRepository.create(specialtyPayload);
      await refSpecialtyRepository.save(refSpecialtyRepository.create(speicalty));
    }

    console.log(`Seeded ${specialtiesData.length} specialties`);
  }
}
