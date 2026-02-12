import { MigrationInterface, QueryRunner } from "typeorm";

export class UserEntityChanged1770845436751 implements MigrationInterface {
    name = 'UserEntityChanged1770845436751'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" ADD "mustResetPassword" boolean NOT NULL DEFAULT false`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "mustResetPassword"`);
    }

}
