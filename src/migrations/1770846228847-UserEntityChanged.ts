import { MigrationInterface, QueryRunner } from "typeorm";

export class UserEntityChanged1770846228847 implements MigrationInterface {
    name = 'UserEntityChanged1770846228847'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Step 1: Add username column as nullable first
        await queryRunner.query(`ALTER TABLE "users" ADD "username" character varying`);

        // Step 2: Populate username from name for existing users
        // Convert name to lowercase, remove spaces, and add a random suffix if needed
        await queryRunner.query(`
            UPDATE "users" 
            SET "username" = LOWER(REPLACE("name", ' ', '_'))
            WHERE "username" IS NULL
        `);

        // Step 3: Handle potential duplicates by adding row number suffix
        await queryRunner.query(`
            WITH numbered_users AS (
                SELECT 
                    id,
                    username,
                    ROW_NUMBER() OVER (PARTITION BY username ORDER BY "createdAt") as rn
                FROM "users"
            )
            UPDATE "users" u
            SET username = nu.username || '_' || nu.rn
            FROM numbered_users nu
            WHERE u.id = nu.id AND nu.rn > 1
        `);

        // Step 4: Now make username NOT NULL
        await queryRunner.query(`ALTER TABLE "users" ALTER COLUMN "username" SET NOT NULL`);

        // Step 5: Add unique constraint
        await queryRunner.query(`ALTER TABLE "users" ADD CONSTRAINT "UQ_fe0bb3f6520ee0469504521e710" UNIQUE ("username")`);

        // Step 6: Make email nullable
        await queryRunner.query(`ALTER TABLE "users" ALTER COLUMN "email" DROP NOT NULL`);

        // Step 7: Drop unique constraint on email
        await queryRunner.query(`ALTER TABLE "users" DROP CONSTRAINT "UQ_97672ac88f789774dd47f7c8be3"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" ADD CONSTRAINT "UQ_97672ac88f789774dd47f7c8be3" UNIQUE ("email")`);
        await queryRunner.query(`ALTER TABLE "users" ALTER COLUMN "email" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "users" DROP CONSTRAINT "UQ_fe0bb3f6520ee0469504521e710"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "username"`);
    }

}
