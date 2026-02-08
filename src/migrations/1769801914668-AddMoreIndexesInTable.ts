import { MigrationInterface, QueryRunner } from "typeorm";

export class AddMoreIndexesInTable1769801914668 implements MigrationInterface {
    name = 'AddMoreIndexesInTable1769801914668'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE INDEX "IDX_3b3374e703fc7fc9d11bcc0d99" ON "payment_slips" ("requestId") `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "public"."IDX_3b3374e703fc7fc9d11bcc0d99"`);
    }

}
