import express, { Router } from "express"
import { ConfigModule } from "@medusajs/medusa/dist/types/global"
import { attachStoreRoutes } from "./store"
import { attachAdminRoutes } from "./admin"

export default (rootDirectory: string, config: ConfigModule): Router | Router[] => {
  const app = Router()

  attachStoreRoutes(app)
  attachAdminRoutes(app)

  return app
}
