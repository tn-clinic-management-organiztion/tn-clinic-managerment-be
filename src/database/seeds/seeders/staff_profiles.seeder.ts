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
        assigned_room_id: staffProfileData.assigned_room_id ?? undefined,
        specialty_id: staffProfileData.specialty_id ?? undefined, 
        signature_url: staffProfileData.signature_url ?? undefined,
        deleted_at: staffProfileData.deleted_at ?? undefined,
      }
      const staffProfile = staffProfileRepository.create(staffProfilePayload);
      await staffProfileRepository.save(staffProfile);
    }

    console.log(`Seeded ${staffProfilesData.length} staff profiles`);
  }
}
