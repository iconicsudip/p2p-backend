import { MigrationInterface, QueryRunner } from "typeorm";

export class UserActivityEntity1770955048615 implements MigrationInterface {
    name = 'UserActivityEntity1770955048615'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."user_activities_action_enum" AS ENUM('LOGIN', 'LOGOUT')`);
        await queryRunner.query(`CREATE TABLE "user_activities" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "userId" uuid NOT NULL, "action" "public"."user_activities_action_enum" NOT NULL, "ipAddress" character varying, "userAgent" text, "timestamp" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_1245d4d2cf04ba7743f2924d951" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "idx_user_activities_user_id" ON "user_activities" ("userId") `);
        await queryRunner.query(`CREATE INDEX "idx_user_activities_created_at" ON "user_activities" ("timestamp") `);
        await queryRunner.query(`ALTER TABLE "user_activities" ADD CONSTRAINT "FK_5618ade060df353e3965b759995" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "user_activities" DROP CONSTRAINT "FK_5618ade060df353e3965b759995"`);
        await queryRunner.query(`DROP INDEX "public"."idx_user_activities_created_at"`);
        await queryRunner.query(`DROP INDEX "public"."idx_user_activities_user_id"`);
        await queryRunner.query(`DROP TABLE "user_activities"`);
        await queryRunner.query(`DROP TYPE "public"."user_activities_action_enum"`);
    }

}
