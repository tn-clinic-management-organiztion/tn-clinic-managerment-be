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
        username: userData.username ?? undefined,
        password: userData.password ?? undefined,
        email: userData.email ?? undefined,
        phone: userData.phone ?? undefined,
        cccd: userData.cccd ?? undefined,
        refresh_token_hash: userData.refresh_token_hash ?? undefined,
        deleted_at: userData.deleted_at ?? undefined,
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
