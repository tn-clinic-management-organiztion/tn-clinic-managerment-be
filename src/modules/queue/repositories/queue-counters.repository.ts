import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { QueueCounter } from 'src/database/entities/queue/queue_counters.entity';
import { QueueTicketType } from 'src/database/entities/queue/queue_tickets.entity';
import { EntityManager, Repository } from 'typeorm';

@Injectable()
export class QueueCountersRepository {
  constructor(
    @InjectRepository(QueueCounter)
    private readonly queueCounterRepository: Repository<QueueCounter>,
  ) {}

  async getCounterForRoomAndResetDate(
    roomId: number,
    resetDate: Date,
    manager?: EntityManager,
    useLock: boolean = false,
  ): Promise<QueueCounter | null> {
    const db = manager || this.queueCounterRepository.manager;
    return db.findOne(QueueCounter, {
      where: {
        room_id: roomId,
        reset_date: resetDate,
      },
      lock: useLock ? { mode: 'pessimistic_write' } : undefined,
    });
  }

  async createCounter(
    roomId: number,
    resetDate: Date,
    manager?: EntityManager,
  ): Promise<QueueCounter> {
    const db = manager || this.queueCounterRepository.manager;
    const counter = db.create(QueueCounter, {
      room_id: roomId,
      last_number: 0,
      reset_date: resetDate,
    });
    return db.save(counter);
  }

  async deleteOldCounters(cutoffDate: Date, manager?: EntityManager) {
    const db = manager || this.queueCounterRepository.manager;
    await db.delete(QueueCounter, { reset_date: { $lt: cutoffDate } });
  }
}
