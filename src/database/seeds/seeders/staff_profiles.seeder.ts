import { StaffProfile } from './../../entities/auth/staff_profiles.entity';
import { DataSource } from 'typeorm';
import staffProfilesData from '../data/staff_profiles.data.json';

export class StaffProfileSeeder {
  async run(dataSource: DataSource): Promise<void> {
    const staffProfileRepository = dataSource.getRepository(StaffProfile);

    if (await staffProfileRepository.count() > 0) {
      console.log('Staff profiles already seeded, skipping...');
      return;
    }


    for (const staffProfileData of staffProfilesData) {
      const staffProfilePayload = {
        ...staffProfileData,
        specialty_id: staffProfileData.specialty_id ?? null, 
        signature_url: staffProfileData.signature_url ?? null,
        deleted_at: staffProfileData.deleted_at ?? null,
      }
      const staffProfile = staffProfileRepository.create(staffProfilePayload);
      await staffProfileRepository.save(staffProfile);
    }

    console.log(`Seeded ${staffProfilesData.length} staff profiles`);
  }
}
