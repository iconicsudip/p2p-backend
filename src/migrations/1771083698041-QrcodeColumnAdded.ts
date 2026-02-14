import { MigrationInterface, QueryRunner } from "typeorm";

export class QrcodeColumnAdded1771083698041 implements MigrationInterface {
    name = 'QrcodeColumnAdded1771083698041'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "requests" ADD "qrCode" text`);
        await queryRunner.query(`ALTER TABLE "users" ADD "qrCode" text`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "qrCode"`);
        await queryRunner.query(`ALTER TABLE "requests" DROP COLUMN "qrCode"`);
    }

}
