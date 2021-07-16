import {MigrationInterface, QueryRunner} from "typeorm";

export class initialSchema1626437099783 implements MigrationInterface {
    name = 'initialSchema1626437099783'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "contact_sensors" ("endpoint_id" text PRIMARY KEY NOT NULL, "status" text NOT NULL, "created_at" datetime NOT NULL DEFAULT (datetime('now')))`);
        await queryRunner.query(`CREATE TABLE "oauth_token" ("client_id" text PRIMARY KEY NOT NULL, "access_token" text NOT NULL, "refresh_token" text NOT NULL, "expire" datetime NOT NULL, "created_at" datetime NOT NULL DEFAULT (datetime('now')))`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "oauth_token"`);
        await queryRunner.query(`DROP TABLE "contact_sensors"`);
    }

}
