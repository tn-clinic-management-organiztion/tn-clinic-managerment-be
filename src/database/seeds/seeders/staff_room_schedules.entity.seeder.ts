import { StaffRoomSchedule } from './../../entities/schedule/staff_room_schedules.entity';
import { DataSource } from 'typeorm';
import StaffRoomSchedulesData from '../data/staff_room_schedules.data.json'

export class StaffRoomScheduleSeeder {
  async run(dataSource: DataSource): Promise<void> {
    const staffRoomScheduleRepository =
      dataSource.getRepository(StaffRoomSchedule);

    if ((await staffRoomScheduleRepository.count()) > 0) {
      console.log('Staff room schedules already seeded, skipping...');
      return;
    }

    const currentDate = new Date();
    let i = 0;

    for(const staffRoomSheduleData of StaffRoomSchedulesData) {
      const staffRoomSchedulePayload = {
        ...staffRoomSheduleData,
        work_date: new Date(currentDate.getTime() + i * 24 * 60 * 60 * 1000),
      }
      const staffRoomSchdule = staffRoomScheduleRepository.create(staffRoomSchedulePayload);
      await staffRoomScheduleRepository.save(staffRoomSchdule);
      i++;
      if(i == 6) {
        i = 0;
      }
    }

    console.log(`Seeded ${StaffRoomSchedulesData.length} staff room schedules`);
  }
}
