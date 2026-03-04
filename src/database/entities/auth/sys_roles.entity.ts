import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity('sys_roles')
export class SysRole {
  @PrimaryGeneratedColumn({ name: 'role_id' })
  role_id: number;

  @Column({ name: 'role_code', type: 'varchar', length: 50, unique: true })
  role_code: string;

  @Column({ name: 'role_name', type: 'varchar', length: 100, nullable: true })
  role_name: string | null;

  @Column({ name: 'description', type: 'text', nullable: true })
  description: string | null;
}