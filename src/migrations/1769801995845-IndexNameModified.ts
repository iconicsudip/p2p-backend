import { MigrationInterface, QueryRunner } from "typeorm";

export class IndexNameModified1769801995845 implements MigrationInterface {
    name = 'IndexNameModified1769801995845'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "public"."IDX_3b3374e703fc7fc9d11bcc0d99"`);
        await queryRunner.query(`CREATE INDEX "idx_payment_slips_request_id" ON "payment_slips" ("requestId") `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "public"."idx_payment_slips_request_id"`);
        await queryRunner.query(`CREATE INDEX "IDX_3b3374e703fc7fc9d11bcc0d99" ON "payment_slips" ("requestId") `);
    }

}
