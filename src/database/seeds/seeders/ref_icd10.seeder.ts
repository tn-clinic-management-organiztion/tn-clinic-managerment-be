import { RefIcd10 } from './../../entities/clinical/ref_icd10.entity';
import { DataSource } from 'typeorm';
import icdsData from '../data/ref_icd10.data.json';

export class RefIcd10Seeder {
  async run(dataSource: DataSource): Promise<void> {
    const refIcd10Repository = dataSource.getRepository(RefIcd10);

    const count = await refIcd10Repository.count();
    if (count > 10) {
      console.log('ICD10 already seeded, skipping...');
      return;
    }

    for (const icdData of icdsData) {
      const icdPaylaod = {
        ...icdData,
        parent_code: icdData.parent_code ?? null,
        name_en: icdData.name_en ?? null,
        level: icdData.level ?? null,
      };

      const icd = refIcd10Repository.create(icdPaylaod);
      await refIcd10Repository.save(refIcd10Repository.create(icd));
    }
    
    console.log(`Seeded ${icdsData.length} ICD10 codes`);
  }
}
