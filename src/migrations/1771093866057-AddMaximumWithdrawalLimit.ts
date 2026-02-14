import { MigrationInterface, QueryRunner } from "typeorm";

export class AddMaximumWithdrawalLimit1771093866057 implements MigrationInterface {
    name = 'AddMaximumWithdrawalLimit1771093866057'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" ADD "maxWithdrawalLimit" numeric(10,2)`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "maxWithdrawalLimit"`);
    }

}
