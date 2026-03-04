import { SysUser } from './../../entities/auth/sys_users.entity';
import { DataSource } from 'typeorm';
import usersData from '../data/sys_users.data.json';
import { hashData } from 'src/utils/hash.util';

export class SysUserSeeder {
  async run(dataSource: DataSource): Promise<void> {
    const sysUserRepository = dataSource.getRepository(SysUser);

    if ((await sysUserRepository.count()) > 0) {
      console.log('Users already seeded, skipping...');
      return;
    }

    for (const userData of usersData) {
      let userPayload = {
        ...userData,
        username: userData.username ?? null,
        password: userData.password ?? null,
        email: userData.email ?? null,
        phone: userData.phone ?? null,
        cccd: userData.cccd ?? null,
        refresh_token_hash: userData.refresh_token_hash ?? null,
        deleted_at: userData.deleted_at ?? null,
      };
      if (userPayload.password) {
        userPayload = {
          ...userPayload,
          password: await hashData(userPayload.password),
        };
      }

      const user = sysUserRepository.create(userPayload);

      await sysUserRepository.save(user);
    }

    console.log(`Seeded ${usersData.length} users`);
  }
}
