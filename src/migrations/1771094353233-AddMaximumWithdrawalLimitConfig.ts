import { MigrationInterface, QueryRunner } from "typeorm";

export class AddMaximumWithdrawalLimitConfig1771094353233 implements MigrationInterface {
    name = 'AddMaximumWithdrawalLimitConfig1771094353233'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'users_withdrawallimitconfig_enum') THEN CREATE TYPE "public"."users_withdrawallimitconfig_enum" AS ENUM('GLOBAL', 'CUSTOM', 'UNLIMITED'); END IF; END $$;`);
        await queryRunner.query(`ALTER TABLE "users" ADD "withdrawalLimitConfig" "public"."users_withdrawallimitconfig_enum" NOT NULL DEFAULT 'GLOBAL'`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "withdrawalLimitConfig"`);
        await queryRunner.query(`DROP TYPE IF EXISTS "public"."users_withdrawallimitconfig_enum"`);
    }

}
