import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddPermissionsVersionToRoles1794650100000
  implements MigrationInterface
{
  name = 'AddPermissionsVersionToRoles1794650100000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "roles" ADD "permissions_version" integer NOT NULL DEFAULT 1`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "roles" DROP COLUMN "permissions_version"`,
    );
  }
}
