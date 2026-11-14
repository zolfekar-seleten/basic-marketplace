import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateShoppingAndOrders1794647450174 implements MigrationInterface {
    name = 'CreateShoppingAndOrders1794647450174'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "carts" ("id" SERIAL NOT NULL, "buyer_id" integer NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "REL_eef2fb4d1af19f8cd8a7a069fc" UNIQUE ("buyer_id"), CONSTRAINT "PK_b5f695a59f5ebb50af3c8160816" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "order_items" ("id" SERIAL NOT NULL, "order_id" integer NOT NULL, "product_id" integer NOT NULL, "product_name" character varying(150) NOT NULL, "unit_price" numeric(12,2) NOT NULL, "quantity" integer NOT NULL, "subtotal" numeric(12,2) NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "CHK_order_items_subtotal_positive" CHECK ("subtotal" > 0), CONSTRAINT "CHK_order_items_unit_price_positive" CHECK ("unit_price" > 0), CONSTRAINT "CHK_order_items_quantity_positive" CHECK ("quantity" > 0), CONSTRAINT "PK_005269d8574e6fac0493715c308" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_9263386c35b6b242540f9493b0" ON "order_items"  ("product_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_145532db85752b29c57d2b7b1f" ON "order_items"  ("order_id") `);
        await queryRunner.query(`CREATE TABLE "orders" ("id" SERIAL NOT NULL, "buyer_id" integer NOT NULL, "supplier_id" integer NOT NULL, "status" character varying(20) NOT NULL DEFAULT 'pending', "total_amount" numeric(12,2) NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "CHK_orders_status_allowed" CHECK ("status" IN ('pending', 'completed')), CONSTRAINT "CHK_orders_total_amount_non_negative" CHECK ("total_amount" >= 0), CONSTRAINT "PK_710e2d4957aa5878dfe94e4ac2f" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_b889f777ff0b695e52f7a9ee21" ON "orders"  ("supplier_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_5e90e93d0e036c3fadbaefa4d0" ON "orders"  ("buyer_id") `);
        await queryRunner.query(`CREATE TABLE "cart_items" ("id" SERIAL NOT NULL, "cart_id" integer NOT NULL, "product_id" integer NOT NULL, "quantity" integer NOT NULL DEFAULT '1', "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_cart_items_cart_product" UNIQUE ("cart_id", "product_id"), CONSTRAINT "CHK_cart_items_quantity_positive" CHECK ("quantity" > 0), CONSTRAINT "PK_6fccf5ec03c172d27a28a82928b" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_30e89257a105eab7648a35c7fc" ON "cart_items"  ("product_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_6385a745d9e12a89b859bb2562" ON "cart_items"  ("cart_id") `);
        await queryRunner.query(`ALTER TABLE "carts" ADD CONSTRAINT "FK_eef2fb4d1af19f8cd8a7a069fcf" FOREIGN KEY ("buyer_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "order_items" ADD CONSTRAINT "FK_145532db85752b29c57d2b7b1f1" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "order_items" ADD CONSTRAINT "FK_9263386c35b6b242540f9493b00" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "orders" ADD CONSTRAINT "FK_5e90e93d0e036c3fadbaefa4d0a" FOREIGN KEY ("buyer_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "orders" ADD CONSTRAINT "FK_b889f777ff0b695e52f7a9ee217" FOREIGN KEY ("supplier_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "cart_items" ADD CONSTRAINT "FK_6385a745d9e12a89b859bb25623" FOREIGN KEY ("cart_id") REFERENCES "carts"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "cart_items" ADD CONSTRAINT "FK_30e89257a105eab7648a35c7fce" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "cart_items" DROP CONSTRAINT "FK_30e89257a105eab7648a35c7fce"`);
        await queryRunner.query(`ALTER TABLE "cart_items" DROP CONSTRAINT "FK_6385a745d9e12a89b859bb25623"`);
        await queryRunner.query(`ALTER TABLE "orders" DROP CONSTRAINT "FK_b889f777ff0b695e52f7a9ee217"`);
        await queryRunner.query(`ALTER TABLE "orders" DROP CONSTRAINT "FK_5e90e93d0e036c3fadbaefa4d0a"`);
        await queryRunner.query(`ALTER TABLE "order_items" DROP CONSTRAINT "FK_9263386c35b6b242540f9493b00"`);
        await queryRunner.query(`ALTER TABLE "order_items" DROP CONSTRAINT "FK_145532db85752b29c57d2b7b1f1"`);
        await queryRunner.query(`ALTER TABLE "carts" DROP CONSTRAINT "FK_eef2fb4d1af19f8cd8a7a069fcf"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_6385a745d9e12a89b859bb2562"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_30e89257a105eab7648a35c7fc"`);
        await queryRunner.query(`DROP TABLE "cart_items"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_5e90e93d0e036c3fadbaefa4d0"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_b889f777ff0b695e52f7a9ee21"`);
        await queryRunner.query(`DROP TABLE "orders"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_145532db85752b29c57d2b7b1f"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_9263386c35b6b242540f9493b0"`);
        await queryRunner.query(`DROP TABLE "order_items"`);
        await queryRunner.query(`DROP TABLE "carts"`);
    }

}
