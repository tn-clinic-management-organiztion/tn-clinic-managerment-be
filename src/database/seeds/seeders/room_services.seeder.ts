import { RoomService } from './../../entities/service/room_services.entity'; 
import { DataSource } from 'typeorm';
import roomServicesData from '../data/room_services.data.json';

export class RoomServiceSeeder {
  async run(dataSource: DataSource): Promise<void> {
    const roomServiceRepository = dataSource.getRepository(RoomService);

    if (await roomServiceRepository.count() > 0) {
      console.log('Room services already seeded, skipping...');
      return;
    }

    for (const roomServiceData of roomServicesData) {
      const roomService = roomServiceRepository.create(roomServiceData);
      await roomServiceRepository.save(roomService);
    }

    console.log(`Seeded ${roomServicesData.length} room-services`);
  }
}
