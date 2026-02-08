import { MigrationInterface, QueryRunner } from "typeorm";

export class AddMoreIndexesInTable1769799256262 implements MigrationInterface {
    name = 'AddMoreIndexesInTable1769799256262'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE INDEX "idx_requests_picked_by_created_at" ON "requests" ("pickedById", "createdAt") `);
        await queryRunner.query(`CREATE INDEX "idx_requests_created_by_created_at" ON "requests" ("createdById", "createdAt") `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "public"."idx_requests_created_by_created_at"`);
        await queryRunner.query(`DROP INDEX "public"."idx_requests_picked_by_created_at"`);
    }

}
