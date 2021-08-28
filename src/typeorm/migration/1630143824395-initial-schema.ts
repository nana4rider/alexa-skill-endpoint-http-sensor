import {MigrationInterface, QueryRunner} from "typeorm";

export class initialSchema1630143824395 implements MigrationInterface {
    name = 'initialSchema1630143824395'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "contact_sensors" ("endpoint_id" text PRIMARY KEY NOT NULL, "status" text NOT NULL, "created_at" datetime NOT NULL DEFAULT (datetime('now')))`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "contact_sensors"`);
    }

}
