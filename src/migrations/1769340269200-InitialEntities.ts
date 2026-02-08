import { MigrationInterface, QueryRunner } from "typeorm";
import * as bcrypt from 'bcrypt';

export class InitialEntities1769340269200 implements MigrationInterface {
    name = 'InitialEntities1769340269200'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."transactions_type_enum" AS ENUM('WITHDRAWAL', 'DEPOSIT')`);
        await queryRunner.query(`CREATE TABLE "transactions" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "requestId" uuid NOT NULL, "vendorId" uuid NOT NULL, "type" "public"."transactions_type_enum" NOT NULL, "amount" numeric(12,2) NOT NULL, "status" character varying NOT NULL DEFAULT 'COMPLETED', "createdAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_a219afd8dd77ed80f5a862f1db9" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "payment_slips" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "requestId" uuid NOT NULL, "uploadedById" uuid NOT NULL, "fileUrl" character varying NOT NULL, "amount" numeric(12,2) NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_82bfb12a1921a64d890591b4982" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."notifications_type_enum" AS ENUM('REQUEST_PICKED', 'PAYMENT_UPLOADED', 'PAYMENT_APPROVED', 'PAYMENT_REJECTED', 'ADMIN_ALERT')`);
        await queryRunner.query(`CREATE TABLE "notifications" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "userId" uuid NOT NULL, "message" text NOT NULL, "type" "public"."notifications_type_enum" NOT NULL, "isRead" boolean NOT NULL DEFAULT false, "requestId" uuid, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_6a72c3c0f683f6462415e653c3a" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."requests_type_enum" AS ENUM('WITHDRAWAL', 'DEPOSIT')`);
        await queryRunner.query(`CREATE TYPE "public"."requests_status_enum" AS ENUM('PENDING', 'PICKED', 'PAID_FULL', 'PAID_PARTIAL', 'COMPLETED', 'REJECTED')`);
        await queryRunner.query(`CREATE TABLE "requests" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "type" "public"."requests_type_enum" NOT NULL, "amount" numeric(12,2) NOT NULL, "status" "public"."requests_status_enum" NOT NULL DEFAULT 'PENDING', "bankDetails" jsonb, "upiId" character varying, "paidAmount" numeric(12,2) NOT NULL DEFAULT '0', "pendingAmount" numeric(12,2) NOT NULL DEFAULT '0', "rejectionReason" character varying, "createdById" uuid NOT NULL, "pickedById" uuid, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_0428f484e96f9e6a55955f29b5f" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."users_role_enum" AS ENUM('SUPER_ADMIN', 'VENDOR')`);
        await queryRunner.query(`CREATE TABLE "users" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "email" character varying NOT NULL, "password" character varying NOT NULL, "name" character varying NOT NULL, "role" "public"."users_role_enum" NOT NULL DEFAULT 'VENDOR', "bankDetails" jsonb, "upiId" character varying, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_97672ac88f789774dd47f7c8be3" UNIQUE ("email"), CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "transactions" ADD CONSTRAINT "FK_9b3909941cea314e5645f9428d4" FOREIGN KEY ("requestId") REFERENCES "requests"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "transactions" ADD CONSTRAINT "FK_aef39924418b6af16c8b074fe46" FOREIGN KEY ("vendorId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "payment_slips" ADD CONSTRAINT "FK_3b3374e703fc7fc9d11bcc0d995" FOREIGN KEY ("requestId") REFERENCES "requests"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "payment_slips" ADD CONSTRAINT "FK_cb94bf0e9ccce437742684d9f30" FOREIGN KEY ("uploadedById") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "notifications" ADD CONSTRAINT "FK_692a909ee0fa9383e7859f9b406" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "notifications" ADD CONSTRAINT "FK_7f30bf6237f6d8c74823f183960" FOREIGN KEY ("requestId") REFERENCES "requests"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "requests" ADD CONSTRAINT "FK_05061437f8bbfcfef7bef98d1ad" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "requests" ADD CONSTRAINT "FK_37dde6a42fb22958f0812a680af" FOREIGN KEY ("pickedById") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);

        // Create default super admin user
        const defaultPassword = await bcrypt.hash('Admin@123', 10);
        await queryRunner.query(`
            INSERT INTO "users" ("email", "password", "name", "role", "createdAt", "updatedAt")
            VALUES ('admin@cashtrack.com', '${defaultPassword}', 'Super Admin', 'SUPER_ADMIN', NOW(), NOW())
            ON CONFLICT ("email") DO NOTHING
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "requests" DROP CONSTRAINT "FK_37dde6a42fb22958f0812a680af"`);
        await queryRunner.query(`ALTER TABLE "requests" DROP CONSTRAINT "FK_05061437f8bbfcfef7bef98d1ad"`);
        await queryRunner.query(`ALTER TABLE "notifications" DROP CONSTRAINT "FK_7f30bf6237f6d8c74823f183960"`);
        await queryRunner.query(`ALTER TABLE "notifications" DROP CONSTRAINT "FK_692a909ee0fa9383e7859f9b406"`);
        await queryRunner.query(`ALTER TABLE "payment_slips" DROP CONSTRAINT "FK_cb94bf0e9ccce437742684d9f30"`);
        await queryRunner.query(`ALTER TABLE "payment_slips" DROP CONSTRAINT "FK_3b3374e703fc7fc9d11bcc0d995"`);
        await queryRunner.query(`ALTER TABLE "transactions" DROP CONSTRAINT "FK_aef39924418b6af16c8b074fe46"`);
        await queryRunner.query(`ALTER TABLE "transactions" DROP CONSTRAINT "FK_9b3909941cea314e5645f9428d4"`);
        await queryRunner.query(`DROP TABLE "users"`);
        await queryRunner.query(`DROP TYPE "public"."users_role_enum"`);
        await queryRunner.query(`DROP TABLE "requests"`);
        await queryRunner.query(`DROP TYPE "public"."requests_status_enum"`);
        await queryRunner.query(`DROP TYPE "public"."requests_type_enum"`);
        await queryRunner.query(`DROP TABLE "notifications"`);
        await queryRunner.query(`DROP TYPE "public"."notifications_type_enum"`);
        await queryRunner.query(`DROP TABLE "payment_slips"`);
        await queryRunner.query(`DROP TABLE "transactions"`);
        await queryRunner.query(`DROP TYPE "public"."transactions_type_enum"`);
    }

}
