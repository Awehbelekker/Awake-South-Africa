import { loadEnv, defineConfig } from '@medusajs/framework/utils'

loadEnv(process.env.NODE_ENV || 'development', process.cwd())

const DATABASE_URL = process.env.DATABASE_URL || "postgres://localhost/medusa-v2"

// Enable SSL for Supabase/remote databases
const isRemoteDb = DATABASE_URL.includes("supabase") ||
  DATABASE_URL.includes("railway") ||
  process.env.NODE_ENV === "production"

module.exports = defineConfig({
  projectConfig: {
    databaseUrl: DATABASE_URL,
    databaseDriverOptions: isRemoteDb ? {
      ssl: { rejectUnauthorized: false },
    } : undefined,
    http: {
      storeCors: process.env.STORE_CORS!,
      adminCors: process.env.ADMIN_CORS!,
      authCors: process.env.AUTH_CORS!,
      jwtSecret: process.env.JWT_SECRET || "supersecret",
      cookieSecret: process.env.COOKIE_SECRET || "supersecret",
    }
  }
})
