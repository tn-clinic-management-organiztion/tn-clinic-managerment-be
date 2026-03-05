import { MigrationInterface, QueryRunner } from "typeorm";

export class UpdateMigration1772747880257 implements MigrationInterface {
    name = 'UpdateMigration1772747880257'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "service_request_items" DROP CONSTRAINT "FK_424b72bb10b851e7cd22027d3ae"`);
        await queryRunner.query(`ALTER TABLE "service_request_items" DROP COLUMN "queue_ticket_id"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "service_request_items" ADD "queue_ticket_id" uuid`);
        await queryRunner.query(`ALTER TABLE "service_request_items" ADD CONSTRAINT "FK_424b72bb10b851e7cd22027d3ae" FOREIGN KEY ("queue_ticket_id") REFERENCES "queue_tickets"("ticket_id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

}
