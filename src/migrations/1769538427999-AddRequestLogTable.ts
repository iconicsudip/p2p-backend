import { MigrationInterface, QueryRunner } from "typeorm";

export class AddRequestLogTable1769538427999 implements MigrationInterface {
    name = 'AddRequestLogTable1769538427999'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."request_logs_action_enum" AS ENUM('CREATED', 'PICKED', 'PAYMENT_UPLOADED', 'PAYMENT_APPROVED', 'PAYMENT_REJECTED', 'PARTIAL_PAYMENT_APPROVED', 'COMPLETED')`);
        await queryRunner.query(`CREATE TABLE "request_logs" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "requestId" uuid NOT NULL, "userId" uuid NOT NULL, "action" "public"."request_logs_action_enum" NOT NULL, "comment" text, "metadata" jsonb, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_1edd3815ae37a9b9511f5a26dca" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "request_logs" ADD CONSTRAINT "FK_33c4c3a3815f57420024f66571e" FOREIGN KEY ("requestId") REFERENCES "requests"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "request_logs" ADD CONSTRAINT "FK_96ca790725861f7b54ce7636f40" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "request_logs" DROP CONSTRAINT "FK_96ca790725861f7b54ce7636f40"`);
        await queryRunner.query(`ALTER TABLE "request_logs" DROP CONSTRAINT "FK_33c4c3a3815f57420024f66571e"`);
        await queryRunner.query(`DROP TABLE "request_logs"`);
        await queryRunner.query(`DROP TYPE "public"."request_logs_action_enum"`);
    }

}
