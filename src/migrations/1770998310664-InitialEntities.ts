import { MigrationInterface, QueryRunner } from "typeorm";

export class InitialEntities1771080127008 implements MigrationInterface {
    name = 'InitialEntities1771080127008'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'transactions_type_enum') THEN CREATE TYPE "public"."transactions_type_enum" AS ENUM('WITHDRAWAL', 'DEPOSIT'); END IF; END $$;`);
        await queryRunner.query(`CREATE TABLE IF NOT EXISTS "transactions" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "requestId" uuid NOT NULL, "vendorId" uuid NOT NULL, "type" "public"."transactions_type_enum" NOT NULL, "amount" numeric(12,2) NOT NULL, "status" character varying NOT NULL DEFAULT 'COMPLETED', "createdAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_a219afd8dd77ed80f5a862f1db9" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_transactions_request_id" ON "transactions" ("requestId") `);
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_transactions_vendor_id" ON "transactions" ("vendorId") `);
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_transactions_type" ON "transactions" ("type") `);
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_transactions_created_at" ON "transactions" ("createdAt") `);
        await queryRunner.query(`CREATE TABLE IF NOT EXISTS "payment_slips" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "requestId" uuid NOT NULL, "uploadedById" uuid NOT NULL, "fileUrl" text, "amount" numeric(12,2) NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_82bfb12a1921a64d890591b4982" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_payment_slips_request_id" ON "payment_slips" ("requestId") `);
        await queryRunner.query(`DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'notifications_type_enum') THEN CREATE TYPE "public"."notifications_type_enum" AS ENUM('REQUEST_PICKED', 'PAYMENT_UPLOADED', 'PAYMENT_APPROVED', 'PAYMENT_REJECTED', 'ADMIN_ALERT', 'PAYMENT_FAILED', 'REQUEST_CANCELLED'); END IF; END $$;`);
        await queryRunner.query(`CREATE TABLE IF NOT EXISTS "notifications" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "userId" uuid NOT NULL, "message" text NOT NULL, "type" "public"."notifications_type_enum" NOT NULL, "isRead" boolean NOT NULL DEFAULT false, "requestId" uuid, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_6a72c3c0f683f6462415e653c3a" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_notifications_user_id" ON "notifications" ("userId") `);
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_notifications_is_read" ON "notifications" ("isRead") `);
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_notifications_created_at" ON "notifications" ("createdAt") `);
        await queryRunner.query(`DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'requests_type_enum') THEN CREATE TYPE "public"."requests_type_enum" AS ENUM('WITHDRAWAL', 'DEPOSIT'); END IF; END $$;`);
        await queryRunner.query(`DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'requests_status_enum') THEN CREATE TYPE "public"."requests_status_enum" AS ENUM('PENDING', 'PICKED', 'PAID_FULL', 'PAID_PARTIAL', 'COMPLETED', 'REJECTED', 'PAYMENT_FAILED'); END IF; END $$;`);
        await queryRunner.query(`CREATE TABLE IF NOT EXISTS "requests" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "type" "public"."requests_type_enum" NOT NULL, "amount" numeric(12,2) NOT NULL, "status" "public"."requests_status_enum" NOT NULL DEFAULT 'PENDING', "bankDetails" jsonb, "upiId" text, "paidAmount" numeric(12,2) NOT NULL DEFAULT '0', "pendingAmount" numeric(12,2) NOT NULL DEFAULT '0', "rejectionReason" text, "paymentFailureReason" text, "cancellationReason" text, "createdById" uuid NOT NULL, "pickedById" uuid, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP, CONSTRAINT "PK_0428f484e96f9e6a55955f29b5f" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_requests_status" ON "requests" ("status") `);
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_requests_created_by" ON "requests" ("createdById") `);
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_requests_picked_by" ON "requests" ("pickedById") `);
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_requests_created_at" ON "requests" ("createdAt") `);
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_requests_picked_by_created_at" ON "requests" ("pickedById", "createdAt") `);
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_requests_created_by_created_at" ON "requests" ("createdById", "createdAt") `);
        await queryRunner.query(`DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'users_role_enum') THEN CREATE TYPE "public"."users_role_enum" AS ENUM('SUPER_ADMIN', 'VENDOR'); END IF; END $$;`);
        await queryRunner.query(`CREATE TABLE IF NOT EXISTS "users" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "username" character varying NOT NULL, "email" character varying, "password" character varying NOT NULL, "tempPassword" character varying, "name" character varying NOT NULL, "role" "public"."users_role_enum" NOT NULL DEFAULT 'VENDOR', "bankDetails" jsonb, "upiId" character varying, "mustResetPassword" boolean NOT NULL DEFAULT false, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_fe0bb3f6520ee0469504521e710" UNIQUE ("username"), CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id"))`);
        await queryRunner.query(`DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_activities_action_enum') THEN CREATE TYPE "public"."user_activities_action_enum" AS ENUM('LOGIN', 'LOGOUT'); END IF; END $$;`);
        await queryRunner.query(`CREATE TABLE IF NOT EXISTS "user_activities" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "userId" uuid NOT NULL, "action" "public"."user_activities_action_enum" NOT NULL, "ipAddress" character varying, "userAgent" text, "timestamp" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_1245d4d2cf04ba7743f2924d951" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_user_activities_user_id" ON "user_activities" ("userId") `);
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_user_activities_created_at" ON "user_activities" ("timestamp") `);
        await queryRunner.query(`DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'request_logs_action_enum') THEN CREATE TYPE "public"."request_logs_action_enum" AS ENUM('CREATED', 'PICKED', 'PAYMENT_UPLOADED', 'PAYMENT_APPROVED', 'PAYMENT_REJECTED', 'PARTIAL_PAYMENT_APPROVED', 'COMPLETED', 'PAYMENT_FAILED', 'REQUEST_REVERTED', 'REQUEST_EDITED', 'REQUEST_CANCELLED'); END IF; END $$;`);
        await queryRunner.query(`CREATE TABLE IF NOT EXISTS "request_logs" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "requestId" uuid NOT NULL, "userId" uuid NOT NULL, "action" "public"."request_logs_action_enum" NOT NULL, "comment" text, "metadata" jsonb, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_1edd3815ae37a9b9511f5a26dca" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_request_logs_request_id" ON "request_logs" ("requestId") `);
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_request_logs_user_id" ON "request_logs" ("userId") `);
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_request_logs_created_at" ON "request_logs" ("createdAt") `);
        await queryRunner.query(`DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'FK_9b3909941cea314e5645f9428d4') THEN ALTER TABLE "transactions" ADD CONSTRAINT "FK_9b3909941cea314e5645f9428d4" FOREIGN KEY ("requestId") REFERENCES "requests"("id") ON DELETE NO ACTION ON UPDATE NO ACTION; END IF; END $$;`);
        await queryRunner.query(`DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'FK_aef39924418b6af16c8b074fe46') THEN ALTER TABLE "transactions" ADD CONSTRAINT "FK_aef39924418b6af16c8b074fe46" FOREIGN KEY ("vendorId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION; END IF; END $$;`);
        await queryRunner.query(`DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'FK_3b3374e703fc7fc9d11bcc0d995') THEN ALTER TABLE "payment_slips" ADD CONSTRAINT "FK_3b3374e703fc7fc9d11bcc0d995" FOREIGN KEY ("requestId") REFERENCES "requests"("id") ON DELETE NO ACTION ON UPDATE NO ACTION; END IF; END $$;`);
        await queryRunner.query(`DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'FK_cb94bf0e9ccce437742684d9f30') THEN ALTER TABLE "payment_slips" ADD CONSTRAINT "FK_cb94bf0e9ccce437742684d9f30" FOREIGN KEY ("uploadedById") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION; END IF; END $$;`);
        await queryRunner.query(`DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'FK_692a909ee0fa9383e7859f9b406') THEN ALTER TABLE "notifications" ADD CONSTRAINT "FK_692a909ee0fa9383e7859f9b406" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION; END IF; END $$;`);
        await queryRunner.query(`DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'FK_7f30bf6237f6d8c74823f183960') THEN ALTER TABLE "notifications" ADD CONSTRAINT "FK_7f30bf6237f6d8c74823f183960" FOREIGN KEY ("requestId") REFERENCES "requests"("id") ON DELETE NO ACTION ON UPDATE NO ACTION; END IF; END $$;`);
        await queryRunner.query(`DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'FK_05061437f8bbfcfef7bef98d1ad') THEN ALTER TABLE "requests" ADD CONSTRAINT "FK_05061437f8bbfcfef7bef98d1ad" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION; END IF; END $$;`);
        await queryRunner.query(`DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'FK_37dde6a42fb22958f0812a680af') THEN ALTER TABLE "requests" ADD CONSTRAINT "FK_37dde6a42fb22958f0812a680af" FOREIGN KEY ("pickedById") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION; END IF; END $$;`);
        await queryRunner.query(`DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'FK_5618ade060df353e3965b759995') THEN ALTER TABLE "user_activities" ADD CONSTRAINT "FK_5618ade060df353e3965b759995" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION; END IF; END $$;`);
        await queryRunner.query(`DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'FK_33c4c3a3815f57420024f66571e') THEN ALTER TABLE "request_logs" ADD CONSTRAINT "FK_33c4c3a3815f57420024f66571e" FOREIGN KEY ("requestId") REFERENCES "requests"("id") ON DELETE NO ACTION ON UPDATE NO ACTION; END IF; END $$;`);
        await queryRunner.query(`DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'FK_96ca790725861f7b54ce7636f40') THEN ALTER TABLE "request_logs" ADD CONSTRAINT "FK_96ca790725861f7b54ce7636f40" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION; END IF; END $$;`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "request_logs" DROP CONSTRAINT "FK_96ca790725861f7b54ce7636f40"`);
        await queryRunner.query(`ALTER TABLE "request_logs" DROP CONSTRAINT "FK_33c4c3a3815f57420024f66571e"`);
        await queryRunner.query(`ALTER TABLE "user_activities" DROP CONSTRAINT "FK_5618ade060df353e3965b759995"`);
        await queryRunner.query(`ALTER TABLE "requests" DROP CONSTRAINT "FK_37dde6a42fb22958f0812a680af"`);
        await queryRunner.query(`ALTER TABLE "requests" DROP CONSTRAINT "FK_05061437f8bbfcfef7bef98d1ad"`);
        await queryRunner.query(`ALTER TABLE "notifications" DROP CONSTRAINT "FK_7f30bf6237f6d8c74823f183960"`);
        await queryRunner.query(`ALTER TABLE "notifications" DROP CONSTRAINT "FK_692a909ee0fa9383e7859f9b406"`);
        await queryRunner.query(`ALTER TABLE "payment_slips" DROP CONSTRAINT "FK_cb94bf0e9ccce437742684d9f30"`);
        await queryRunner.query(`ALTER TABLE "payment_slips" DROP CONSTRAINT "FK_3b3374e703fc7fc9d11bcc0d995"`);
        await queryRunner.query(`ALTER TABLE "transactions" DROP CONSTRAINT "FK_aef39924418b6af16c8b074fe46"`);
        await queryRunner.query(`ALTER TABLE "transactions" DROP CONSTRAINT "FK_9b3909941cea314e5645f9428d4"`);
        await queryRunner.query(`DROP INDEX "public"."idx_request_logs_created_at"`);
        await queryRunner.query(`DROP INDEX "public"."idx_request_logs_user_id"`);
        await queryRunner.query(`DROP INDEX "public"."idx_request_logs_request_id"`);
        await queryRunner.query(`DROP TABLE "request_logs"`);
        await queryRunner.query(`DROP TYPE IF EXISTS "public"."request_logs_action_enum"`);
        await queryRunner.query(`DROP INDEX "public"."idx_user_activities_created_at"`);
        await queryRunner.query(`DROP INDEX "public"."idx_user_activities_user_id"`);
        await queryRunner.query(`DROP TABLE "user_activities"`);
        await queryRunner.query(`DROP TYPE IF EXISTS "public"."user_activities_action_enum"`);
        await queryRunner.query(`DROP TABLE "users"`);
        await queryRunner.query(`DROP TYPE IF EXISTS "public"."users_role_enum"`);
        await queryRunner.query(`DROP INDEX "public"."idx_requests_created_by_created_at"`);
        await queryRunner.query(`DROP INDEX "public"."idx_requests_picked_by_created_at"`);
        await queryRunner.query(`DROP INDEX "public"."idx_requests_created_at"`);
        await queryRunner.query(`DROP INDEX "public"."idx_requests_picked_by"`);
        await queryRunner.query(`DROP INDEX "public"."idx_requests_created_by"`);
        await queryRunner.query(`DROP INDEX "public"."idx_requests_status"`);
        await queryRunner.query(`DROP TABLE "requests"`);
        await queryRunner.query(`DROP TYPE IF EXISTS "public"."requests_status_enum"`);
        await queryRunner.query(`DROP TYPE IF EXISTS "public"."requests_type_enum"`);
        await queryRunner.query(`DROP INDEX "public"."idx_notifications_created_at"`);
        await queryRunner.query(`DROP INDEX "public"."idx_notifications_is_read"`);
        await queryRunner.query(`DROP INDEX "public"."idx_notifications_user_id"`);
        await queryRunner.query(`DROP TABLE "notifications"`);
        await queryRunner.query(`DROP TYPE IF EXISTS "public"."notifications_type_enum"`);
        await queryRunner.query(`DROP INDEX "public"."idx_payment_slips_request_id"`);
        await queryRunner.query(`DROP TABLE "payment_slips"`);
        await queryRunner.query(`DROP INDEX "public"."idx_transactions_created_at"`);
        await queryRunner.query(`DROP INDEX "public"."idx_transactions_type"`);
        await queryRunner.query(`DROP INDEX "public"."idx_transactions_vendor_id"`);
        await queryRunner.query(`DROP INDEX "public"."idx_transactions_request_id"`);
        await queryRunner.query(`DROP TABLE "transactions"`);
        await queryRunner.query(`DROP TYPE IF EXISTS "public"."transactions_type_enum"`);
    }

}
