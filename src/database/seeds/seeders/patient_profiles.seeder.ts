import { DataSource } from 'typeorm';
import {
  Gender,
  PatientProfile,
} from './../../entities/auth/patient_profiles.entity';
import patientProfilesData from '../data/patient_profiles.data.json';
export class PatientProfileSeeder {
  async run(dataSource: DataSource): Promise<void> {
    const patientProfileRepository = dataSource.getRepository(PatientProfile);
    const count = await patientProfileRepository.count();
    if (count > 0) {
      console.log('PatientProfiles already seeded, skipping...');
      return;
    }

    for (const patientProfileData of patientProfilesData) {

      const { deleted_at, ...rest } = patientProfileData;

      const profilePayload = {
        ...rest,
        gender: Gender[patientProfileData.gender as keyof typeof Gender],
      };
      const profile = patientProfileRepository.create(profilePayload);
      await patientProfileRepository.save(profile);
    }
     console.log(`Seeded ${patientProfilesData.length} patients`);
  }
}
