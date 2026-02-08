import { MigrationInterface, QueryRunner } from "typeorm";

export class Updateschema1769798248824 implements MigrationInterface {
    name = 'Updateschema1769798248824'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "requests" ADD "paymentFailureReason" text`);
        await queryRunner.query(`ALTER TYPE "public"."notifications_type_enum" RENAME TO "notifications_type_enum_old"`);
        await queryRunner.query(`CREATE TYPE "public"."notifications_type_enum" AS ENUM('REQUEST_PICKED', 'PAYMENT_UPLOADED', 'PAYMENT_APPROVED', 'PAYMENT_REJECTED', 'ADMIN_ALERT', 'PAYMENT_FAILED')`);
        await queryRunner.query(`ALTER TABLE "notifications" ALTER COLUMN "type" TYPE "public"."notifications_type_enum" USING "type"::"text"::"public"."notifications_type_enum"`);
        await queryRunner.query(`DROP TYPE "public"."notifications_type_enum_old"`);
        await queryRunner.query(`ALTER TYPE "public"."requests_status_enum" RENAME TO "requests_status_enum_old"`);
        await queryRunner.query(`CREATE TYPE "public"."requests_status_enum" AS ENUM('PENDING', 'PICKED', 'PAID_FULL', 'PAID_PARTIAL', 'COMPLETED', 'REJECTED', 'PAYMENT_FAILED')`);
        await queryRunner.query(`ALTER TABLE "requests" ALTER COLUMN "status" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "requests" ALTER COLUMN "status" TYPE "public"."requests_status_enum" USING "status"::"text"::"public"."requests_status_enum"`);
        await queryRunner.query(`ALTER TABLE "requests" ALTER COLUMN "status" SET DEFAULT 'PENDING'`);
        await queryRunner.query(`DROP TYPE "public"."requests_status_enum_old"`);
        await queryRunner.query(`ALTER TABLE "requests" DROP COLUMN "upiId"`);
        await queryRunner.query(`ALTER TABLE "requests" ADD "upiId" text`);
        await queryRunner.query(`ALTER TABLE "requests" DROP COLUMN "rejectionReason"`);
        await queryRunner.query(`ALTER TABLE "requests" ADD "rejectionReason" text`);
        await queryRunner.query(`ALTER TYPE "public"."request_logs_action_enum" RENAME TO "request_logs_action_enum_old"`);
        await queryRunner.query(`CREATE TYPE "public"."request_logs_action_enum" AS ENUM('CREATED', 'PICKED', 'PAYMENT_UPLOADED', 'PAYMENT_APPROVED', 'PAYMENT_REJECTED', 'PARTIAL_PAYMENT_APPROVED', 'COMPLETED', 'PAYMENT_FAILED', 'REQUEST_REVERTED', 'REQUEST_EDITED')`);
        await queryRunner.query(`ALTER TABLE "request_logs" ALTER COLUMN "action" TYPE "public"."request_logs_action_enum" USING "action"::"text"::"public"."request_logs_action_enum"`);
        await queryRunner.query(`DROP TYPE "public"."request_logs_action_enum_old"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."request_logs_action_enum_old" AS ENUM('CREATED', 'PICKED', 'PAYMENT_UPLOADED', 'PAYMENT_APPROVED', 'PAYMENT_REJECTED', 'PARTIAL_PAYMENT_APPROVED', 'COMPLETED')`);
        await queryRunner.query(`ALTER TABLE "request_logs" ALTER COLUMN "action" TYPE "public"."request_logs_action_enum_old" USING "action"::"text"::"public"."request_logs_action_enum_old"`);
        await queryRunner.query(`DROP TYPE "public"."request_logs_action_enum"`);
        await queryRunner.query(`ALTER TYPE "public"."request_logs_action_enum_old" RENAME TO "request_logs_action_enum"`);
        await queryRunner.query(`ALTER TABLE "requests" DROP COLUMN "rejectionReason"`);
        await queryRunner.query(`ALTER TABLE "requests" ADD "rejectionReason" character varying`);
        await queryRunner.query(`ALTER TABLE "requests" DROP COLUMN "upiId"`);
        await queryRunner.query(`ALTER TABLE "requests" ADD "upiId" character varying`);
        await queryRunner.query(`CREATE TYPE "public"."requests_status_enum_old" AS ENUM('PENDING', 'PICKED', 'PAID_FULL', 'PAID_PARTIAL', 'COMPLETED', 'REJECTED')`);
        await queryRunner.query(`ALTER TABLE "requests" ALTER COLUMN "status" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "requests" ALTER COLUMN "status" TYPE "public"."requests_status_enum_old" USING "status"::"text"::"public"."requests_status_enum_old"`);
        await queryRunner.query(`ALTER TABLE "requests" ALTER COLUMN "status" SET DEFAULT 'PENDING'`);
        await queryRunner.query(`DROP TYPE "public"."requests_status_enum"`);
        await queryRunner.query(`ALTER TYPE "public"."requests_status_enum_old" RENAME TO "requests_status_enum"`);
        await queryRunner.query(`CREATE TYPE "public"."notifications_type_enum_old" AS ENUM('REQUEST_PICKED', 'PAYMENT_UPLOADED', 'PAYMENT_APPROVED', 'PAYMENT_REJECTED', 'ADMIN_ALERT')`);
        await queryRunner.query(`ALTER TABLE "notifications" ALTER COLUMN "type" TYPE "public"."notifications_type_enum_old" USING "type"::"text"::"public"."notifications_type_enum_old"`);
        await queryRunner.query(`DROP TYPE "public"."notifications_type_enum"`);
        await queryRunner.query(`ALTER TYPE "public"."notifications_type_enum_old" RENAME TO "notifications_type_enum"`);
        await queryRunner.query(`ALTER TABLE "requests" DROP COLUMN "paymentFailureReason"`);
    }

}
