import { MigrationInterface, QueryRunner } from "typeorm";

export class AddIndexInTables1769798773139 implements MigrationInterface {
    name = 'AddIndexInTables1769798773139'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE INDEX "idx_transactions_request_id" ON "transactions" ("requestId") `);
        await queryRunner.query(`CREATE INDEX "idx_transactions_vendor_id" ON "transactions" ("vendorId") `);
        await queryRunner.query(`CREATE INDEX "idx_transactions_type" ON "transactions" ("type") `);
        await queryRunner.query(`CREATE INDEX "idx_transactions_created_at" ON "transactions" ("createdAt") `);
        await queryRunner.query(`CREATE INDEX "idx_notifications_user_id" ON "notifications" ("userId") `);
        await queryRunner.query(`CREATE INDEX "idx_notifications_is_read" ON "notifications" ("isRead") `);
        await queryRunner.query(`CREATE INDEX "idx_notifications_created_at" ON "notifications" ("createdAt") `);
        await queryRunner.query(`CREATE INDEX "idx_requests_status" ON "requests" ("status") `);
        await queryRunner.query(`CREATE INDEX "idx_requests_created_by" ON "requests" ("createdById") `);
        await queryRunner.query(`CREATE INDEX "idx_requests_picked_by" ON "requests" ("pickedById") `);
        await queryRunner.query(`CREATE INDEX "idx_requests_created_at" ON "requests" ("createdAt") `);
        await queryRunner.query(`CREATE INDEX "idx_request_logs_request_id" ON "request_logs" ("requestId") `);
        await queryRunner.query(`CREATE INDEX "idx_request_logs_user_id" ON "request_logs" ("userId") `);
        await queryRunner.query(`CREATE INDEX "idx_request_logs_created_at" ON "request_logs" ("createdAt") `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "public"."idx_request_logs_created_at"`);
        await queryRunner.query(`DROP INDEX "public"."idx_request_logs_user_id"`);
        await queryRunner.query(`DROP INDEX "public"."idx_request_logs_request_id"`);
        await queryRunner.query(`DROP INDEX "public"."idx_requests_created_at"`);
        await queryRunner.query(`DROP INDEX "public"."idx_requests_picked_by"`);
        await queryRunner.query(`DROP INDEX "public"."idx_requests_created_by"`);
        await queryRunner.query(`DROP INDEX "public"."idx_requests_status"`);
        await queryRunner.query(`DROP INDEX "public"."idx_notifications_created_at"`);
        await queryRunner.query(`DROP INDEX "public"."idx_notifications_is_read"`);
        await queryRunner.query(`DROP INDEX "public"."idx_notifications_user_id"`);
        await queryRunner.query(`DROP INDEX "public"."idx_transactions_created_at"`);
        await queryRunner.query(`DROP INDEX "public"."idx_transactions_type"`);
        await queryRunner.query(`DROP INDEX "public"."idx_transactions_vendor_id"`);
        await queryRunner.query(`DROP INDEX "public"."idx_transactions_request_id"`);
    }

}
