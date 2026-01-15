import { OrgRoom, RoomType } from './../../entities/auth/org_rooms.entity';
import { DataSource } from 'typeorm';
import orgRoomsData from '../data/org_rooms.data.json';

export class OrgRoomSeeder {
  async run(dataSource: DataSource): Promise<void> {
    const orgRoomRepository = dataSource.getRepository(OrgRoom);

    const count = await orgRoomRepository.count();
    if (count > 0) {
      console.log('OrgRooms already seeded, skipping...');
      return;
    }

    for (const orgRoomData of orgRoomsData) {
      const roomPayload = {
        ...orgRoomData,
        room_type: RoomType[orgRoomData.room_type as keyof typeof RoomType],
      };

      const room = orgRoomRepository.create(roomPayload);
      await orgRoomRepository.save(room);
    }

    console.log(`Seeded ${orgRoomsData.length} rooms`);
  }
}
