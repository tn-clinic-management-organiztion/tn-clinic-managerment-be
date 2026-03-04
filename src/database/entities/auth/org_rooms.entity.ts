import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

export enum RoomType {
  CLINIC = 'CLINIC',
  PARACLINICAL = 'PARACLINICAL',
  PHARMACY = 'PHARMACY',
  CASHIER = 'CASHIER',
  ADMIN = 'ADMIN',
}

@Entity('org_rooms')
export class OrgRoom {
  @PrimaryGeneratedColumn({ name: 'room_id' })
  room_id: number;

  @Column({ name: 'room_name', length: 100 })
  room_name: string;

  @Column({ name: 'room_type', type: 'enum', enum: RoomType, nullable: true })
  room_type: RoomType | null;

  @Column({ name: 'is_active', default: true })
  is_active: boolean;
}