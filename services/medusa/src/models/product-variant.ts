import { ProductVariant as MedusaProductVariant } from "@medusajs/medusa"
import { Column, Entity } from "typeorm"

@Entity()
export class ProductVariant extends MedusaProductVariant {
  @Column({ type: "decimal", precision: 10, scale: 2, nullable: true })
  cost_eur?: number

  @Column({ type: "decimal", precision: 10, scale: 2, nullable: true })
  cost_zar?: number

  @Column({ type: "decimal", precision: 10, scale: 2, nullable: true })
  price_ex_vat?: number
}
