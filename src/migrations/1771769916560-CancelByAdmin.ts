import { MigrationInterface, QueryRunner } from "typeorm";

export class CancelByAdmin1771769916560 implements MigrationInterface {
    name = 'CancelByAdmin1771769916560'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "requests" ADD "cancelledByAdmin" boolean NOT NULL DEFAULT false`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "requests" DROP COLUMN "cancelledByAdmin"`);
    }

}
