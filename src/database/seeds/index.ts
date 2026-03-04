import { RoomServiceSeeder } from './seeders/room_services.seeder';
import { RefServiceSeeder } from './seeders/ref_services.seeder';
import { RefServiceCategorySeeder } from './seeders/ref_service_categories.seeder';
import { PatientProfileSeeder } from './seeders/patient_profiles.seeder';
import { StaffProfileSeeder } from './seeders/staff_profiles.seeder';
import { RefSpecialtySeeder } from './seeders/ref_specialties.seeder';
import { SysUserSeeder } from './seeders/sys_users.seeder';
import { SysRoleSeeder } from './seeders/sys_roles.seeder';
import { OrgRoomSeeder } from './seeders/org_rooms.seeder';
import { DataSource } from 'typeorm';
import { RefIcd10Seeder } from './seeders/ref_icd10.seeder';
import { StaffRoomScheduleSeeder } from 'src/database/seeds/seeders/staff_room_schedules.entity.seeder';


export class MainSeeder {
  async run(dataSource: DataSource): Promise<void> {
    console.log('Starting database seeding...\n');

    try {
      await new OrgRoomSeeder().run(dataSource);
      await new SysRoleSeeder().run(dataSource);
      await new SysUserSeeder().run(dataSource);
      await new RefSpecialtySeeder().run(dataSource);
      await new RefIcd10Seeder().run(dataSource);
      await new StaffProfileSeeder().run(dataSource);
      await new PatientProfileSeeder().run(dataSource);
      await new RefServiceCategorySeeder().run(dataSource);
      await new RefServiceSeeder().run(dataSource);
      await new RoomServiceSeeder().run(dataSource);
      await new StaffRoomScheduleSeeder().run(dataSource);

      console.log('\nDatabase seeding completed successfully!');
    } catch (error) {
      console.error('Error during seeding:', error);
      throw error;
    }
  }
}
