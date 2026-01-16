import { MigrationInterface, QueryRunner, TableColumn } from "typeorm"

export class AddProductCostFields1705420800000 implements MigrationInterface {
  name = "AddProductCostFields1705420800000"

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      "product",
      new TableColumn({
        name: "cost_eur",
        type: "decimal",
        precision: 10,
        scale: 2,
        isNullable: true,
      })
    )

    await queryRunner.addColumn(
      "product",
      new TableColumn({
        name: "cost_zar",
        type: "decimal",
        precision: 10,
        scale: 2,
        isNullable: true,
      })
    )

    await queryRunner.addColumn(
      "product",
      new TableColumn({
        name: "skill_level",
        type: "varchar",
        isNullable: true,
      })
    )

    await queryRunner.addColumn(
      "product",
      new TableColumn({
        name: "category_tag",
        type: "varchar",
        isNullable: true,
      })
    )

    await queryRunner.addColumn(
      "product",
      new TableColumn({
        name: "target_margin_percent",
        type: "decimal",
        precision: 5,
        scale: 2,
        isNullable: true,
      })
    )

    await queryRunner.addColumn(
      "product_variant",
      new TableColumn({
        name: "cost_eur",
        type: "decimal",
        precision: 10,
        scale: 2,
        isNullable: true,
      })
    )

    await queryRunner.addColumn(
      "product_variant",
      new TableColumn({
        name: "cost_zar",
        type: "decimal",
        precision: 10,
        scale: 2,
        isNullable: true,
      })
    )

    await queryRunner.addColumn(
      "product_variant",
      new TableColumn({
        name: "price_ex_vat",
        type: "decimal",
        precision: 10,
        scale: 2,
        isNullable: true,
      })
    )
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn("product", "cost_eur")
    await queryRunner.dropColumn("product", "cost_zar")
    await queryRunner.dropColumn("product", "skill_level")
    await queryRunner.dropColumn("product", "category_tag")
    await queryRunner.dropColumn("product", "target_margin_percent")
    await queryRunner.dropColumn("product_variant", "cost_eur")
    await queryRunner.dropColumn("product_variant", "cost_zar")
    await queryRunner.dropColumn("product_variant", "price_ex_vat")
  }
}
