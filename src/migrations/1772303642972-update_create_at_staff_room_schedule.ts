import { MigrationInterface, QueryRunner } from "typeorm";

export class UpdateCreateAtStaffRoomSchedule1772303642972 implements MigrationInterface {
    name = 'UpdateCreateAtStaffRoomSchedule1772303642972'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "staff_room_schedules" ADD "created_at" TIMESTAMP NOT NULL DEFAULT now()`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "staff_room_schedules" DROP COLUMN "created_at"`);
    }

}
