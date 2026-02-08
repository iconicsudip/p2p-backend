import { MigrationInterface, QueryRunner } from "typeorm";

export class RequestSchemaChanged1770360555888 implements MigrationInterface {
    name = 'RequestSchemaChanged1770360555888'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "requests" ADD "deletedAt" TIMESTAMP`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "requests" DROP COLUMN "deletedAt"`);
    }

}
