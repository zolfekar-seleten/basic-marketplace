import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddActiveStatusToUsers1794730000000
  implements MigrationInterface
{
  name = 'AddActiveStatusToUsers1794730000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "users" ADD "is_active" boolean NOT NULL DEFAULT true`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "is_active"`);
  }
}
