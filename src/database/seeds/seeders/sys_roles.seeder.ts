import { SysRole } from './../../entities/auth/sys_roles.entity';
import { DataSource } from 'typeorm';
import rolesData from '../data/sys_roles.data.json';

export class SysRoleSeeder {
  async run(dataSource: DataSource): Promise<void> {
    const sysRoleRepository = dataSource.getRepository(SysRole);

    if (await sysRoleRepository.count() > 0) {
      console.log('Roles already seeded, skipping...');
      return;
    }

    for (const roleData of rolesData) {
      const role = sysRoleRepository.create(roleData);
      await sysRoleRepository.save(role);
    }

    console.log(`Seeded ${rolesData.length} roles`);
  }
}
