import { MigrationInterface, QueryRunner } from "typeorm";

export class BigUpdateTicketServiceItemsStaffRoomSchdedulesReplaceUndefined1772220260667 implements MigrationInterface {
    name = 'BigUpdateTicketServiceItemsStaffRoomSchdedulesReplaceUndefined1772220260667'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "staff_profiles" DROP CONSTRAINT "FK_cb1a0b04899905a2d423ed4b2ee"`);
        await queryRunner.query(`ALTER TABLE "medical_encounters" DROP CONSTRAINT "FK_f11b9babce0f2fef0d5ec9bef57"`);
        await queryRunner.query(`CREATE TABLE "ticket_service_items" ("ticket_id" uuid NOT NULL, "item_id" uuid NOT NULL, CONSTRAINT "PK_a1bff598a1b63b870a00bdaf72e" PRIMARY KEY ("ticket_id", "item_id"))`);
        await queryRunner.query(`CREATE TABLE "staff_room_schedules" ("schedule_id" SERIAL NOT NULL, "staff_id" uuid NOT NULL, "room_id" integer NOT NULL, "work_date" date NOT NULL, "is_active" boolean NOT NULL DEFAULT true, CONSTRAINT "PK_f94f91ba2a4d15f6a062e21d4f6" PRIMARY KEY ("schedule_id"))`);
        await queryRunner.query(`ALTER TABLE "staff_profiles" DROP COLUMN "assigned_room_id"`);
        await queryRunner.query(`ALTER TABLE "medical_encounters" DROP COLUMN "assigned_room_id"`);
        await queryRunner.query(`ALTER TABLE "queue_tickets" DROP COLUMN "service_ids"`);
        await queryRunner.query(`ALTER TABLE "service_request_items" ADD "queue_ticket_id" uuid`);
        await queryRunner.query(`ALTER TYPE "public"."medical_encounters_current_status_enum" RENAME TO "medical_encounters_current_status_enum_old"`);
        await queryRunner.query(`CREATE TYPE "public"."medical_encounters_current_status_enum" AS ENUM('REGISTERED', 'AWAITING_PAYMENT', 'IN_CONSULTATION', 'COMPLETED')`);
        await queryRunner.query(`ALTER TABLE "medical_encounters" ALTER COLUMN "current_status" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "medical_encounters" ALTER COLUMN "current_status" TYPE "public"."medical_encounters_current_status_enum" USING "current_status"::"text"::"public"."medical_encounters_current_status_enum"`);
        await queryRunner.query(`ALTER TABLE "medical_encounters" ALTER COLUMN "current_status" SET DEFAULT 'REGISTERED'`);
        await queryRunner.query(`DROP TYPE "public"."medical_encounters_current_status_enum_old"`);
        await queryRunner.query(`ALTER TABLE "service_request_items" ADD CONSTRAINT "FK_424b72bb10b851e7cd22027d3ae" FOREIGN KEY ("queue_ticket_id") REFERENCES "queue_tickets"("ticket_id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "ticket_service_items" ADD CONSTRAINT "FK_115c202e6e58ede98fec52a1fe3" FOREIGN KEY ("ticket_id") REFERENCES "queue_tickets"("ticket_id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "ticket_service_items" ADD CONSTRAINT "FK_c6a12b8995f8a3d8a90bc929c51" FOREIGN KEY ("item_id") REFERENCES "service_request_items"("item_id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "staff_room_schedules" ADD CONSTRAINT "FK_06ce1f52ae1362428481bca5a4e" FOREIGN KEY ("staff_id") REFERENCES "staff_profiles"("staff_id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "staff_room_schedules" ADD CONSTRAINT "FK_47a003b8a4db9086285f49747e5" FOREIGN KEY ("room_id") REFERENCES "org_rooms"("room_id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "staff_room_schedules" DROP CONSTRAINT "FK_47a003b8a4db9086285f49747e5"`);
        await queryRunner.query(`ALTER TABLE "staff_room_schedules" DROP CONSTRAINT "FK_06ce1f52ae1362428481bca5a4e"`);
        await queryRunner.query(`ALTER TABLE "ticket_service_items" DROP CONSTRAINT "FK_c6a12b8995f8a3d8a90bc929c51"`);
        await queryRunner.query(`ALTER TABLE "ticket_service_items" DROP CONSTRAINT "FK_115c202e6e58ede98fec52a1fe3"`);
        await queryRunner.query(`ALTER TABLE "service_request_items" DROP CONSTRAINT "FK_424b72bb10b851e7cd22027d3ae"`);
        await queryRunner.query(`CREATE TYPE "public"."medical_encounters_current_status_enum_old" AS ENUM('REGISTERED', 'AWAITING_PAYMENT', 'IN_CONSULTATION', 'AWAITING_CLS', 'IN_CLS', 'CLS_COMPLETED', 'RESULTS_READY', 'COMPLETED')`);
        await queryRunner.query(`ALTER TABLE "medical_encounters" ALTER COLUMN "current_status" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "medical_encounters" ALTER COLUMN "current_status" TYPE "public"."medical_encounters_current_status_enum_old" USING "current_status"::"text"::"public"."medical_encounters_current_status_enum_old"`);
        await queryRunner.query(`ALTER TABLE "medical_encounters" ALTER COLUMN "current_status" SET DEFAULT 'REGISTERED'`);
        await queryRunner.query(`DROP TYPE "public"."medical_encounters_current_status_enum"`);
        await queryRunner.query(`ALTER TYPE "public"."medical_encounters_current_status_enum_old" RENAME TO "medical_encounters_current_status_enum"`);
        await queryRunner.query(`ALTER TABLE "service_request_items" DROP COLUMN "queue_ticket_id"`);
        await queryRunner.query(`ALTER TABLE "queue_tickets" ADD "service_ids" integer array`);
        await queryRunner.query(`ALTER TABLE "medical_encounters" ADD "assigned_room_id" integer`);
        await queryRunner.query(`ALTER TABLE "staff_profiles" ADD "assigned_room_id" integer`);
        await queryRunner.query(`DROP TABLE "staff_room_schedules"`);
        await queryRunner.query(`DROP TABLE "ticket_service_items"`);
        await queryRunner.query(`ALTER TABLE "medical_encounters" ADD CONSTRAINT "FK_f11b9babce0f2fef0d5ec9bef57" FOREIGN KEY ("assigned_room_id") REFERENCES "org_rooms"("room_id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "staff_profiles" ADD CONSTRAINT "FK_cb1a0b04899905a2d423ed4b2ee" FOREIGN KEY ("assigned_room_id") REFERENCES "org_rooms"("room_id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

}
