import { Column, Entity, Index, OneToMany } from "typeorm"
import { Product as MedusaProduct } from "@medusajs/medusa"

@Entity()
export class Product extends MedusaProduct {
  @Column({ type: "decimal", precision: 10, scale: 2, nullable: true })
  cost_eur?: number

  @Column({ type: "decimal", precision: 10, scale: 2, nullable: true })
  cost_zar?: number

  @Column({ type: "varchar", nullable: true })
  skill_level?: string

  @Column({ type: "varchar", nullable: true })
  category_tag?: string

  @Column({ type: "decimal", precision: 5, scale: 2, nullable: true })
  target_margin_percent?: number
}
