import { MigrationInterface, QueryRunner } from "typeorm";

export class UpdateDeleteQueueTickerTypeAtQueueCountersEntity1772622070263 implements MigrationInterface {
    name = 'UpdateDeleteQueueTickerTypeAtQueueCountersEntity1772622070263'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "public"."uq_counter_room_type_day"`);
        await queryRunner.query(`ALTER TABLE "queue_counters" DROP COLUMN "ticket_type"`);
        await queryRunner.query(`DROP TYPE "public"."queue_counters_ticket_type_enum"`);
        await queryRunner.query(`CREATE UNIQUE INDEX "uq_counter_room_type_day" ON "queue_counters" ("room_id", "reset_date") `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "public"."uq_counter_room_type_day"`);
        await queryRunner.query(`CREATE TYPE "public"."queue_counters_ticket_type_enum" AS ENUM('REGISTRATION', 'CONSULTATION', 'SERVICE')`);
        await queryRunner.query(`ALTER TABLE "queue_counters" ADD "ticket_type" "public"."queue_counters_ticket_type_enum" NOT NULL`);
        await queryRunner.query(`CREATE UNIQUE INDEX "uq_counter_room_type_day" ON "queue_counters" ("room_id", "ticket_type", "reset_date") `);
    }

}
