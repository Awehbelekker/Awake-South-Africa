const dotenv = require("dotenv");

let ENV_FILE_NAME = "";
switch (process.env.NODE_ENV) {
  case "production":
    ENV_FILE_NAME = ".env.production";
    break;
  case "staging":
    ENV_FILE_NAME = ".env.staging";
    break;
  case "test":
    ENV_FILE_NAME = ".env.test";
    break;
  case "development":
  default:
    ENV_FILE_NAME = ".env";
    break;
}

try {
  dotenv.config({ path: process.env.ENV_FILE_NAME || ENV_FILE_NAME });
} catch (e) {
  // continue regardless of error
}

// CORS configuration
const ADMIN_CORS = process.env.ADMIN_CORS || "http://localhost:7000,http://localhost:7001";
const STORE_CORS = process.env.STORE_CORS || "http://localhost:3000";

// Database configuration
const DATABASE_URL = process.env.DATABASE_URL || "postgres://localhost/medusa-store";

// Redis configuration
const REDIS_URL = process.env.REDIS_URL || "redis://localhost:6379";

// Debug: Log database connection (without password)
if (process.env.NODE_ENV === "production") {
  const dbUrlParts = DATABASE_URL.match(/^(postgresql?:\/\/)([^:]+):([^@]+)@(.+)$/);
  if (dbUrlParts) {
    console.log(`[medusa-config] Connecting to database: ${dbUrlParts[1]}${dbUrlParts[2]}:****@${dbUrlParts[4]}`);
  } else {
    console.log(`[medusa-config] DATABASE_URL format: ${DATABASE_URL.substring(0, 20)}...`);
  }
}

const plugins = [
  `medusa-fulfillment-manual`,
  `medusa-payment-manual`,
  {
    resolve: `@medusajs/file-local`,
    options: {
      upload_dir: "uploads",
    },
  },
  {
    resolve: "@medusajs/admin",
    /** @type {import('@medusajs/admin').PluginOptions} */
    options: {
      // Disable auto-rebuild in production to save memory
      autoRebuild: process.env.NODE_ENV !== "production",
      develop: {
        open: process.env.OPEN_BROWSER !== "false",
      },
    },
  },
];

// Use Redis modules in production if REDIS_URL is set, otherwise use local/inmemory
const modules = REDIS_URL && REDIS_URL !== "redis://localhost:6379"
  ? {
      eventBus: {
        resolve: "@medusajs/event-bus-redis",
        options: {
          redisUrl: REDIS_URL
        }
      },
      cacheService: {
        resolve: "@medusajs/cache-redis",
        options: {
          redisUrl: REDIS_URL
        }
      },
    }
  : {
      eventBus: {
        resolve: "@medusajs/event-bus-local",
      },
      cacheService: {
        resolve: "@medusajs/cache-inmemory",
      },
    };

/** @type {import('@medusajs/medusa').ConfigModule["projectConfig"]} */
const projectConfig = {
  jwtSecret: process.env.JWT_SECRET || "supersecret",
  cookieSecret: process.env.COOKIE_SECRET || "supersecret",
  store_cors: STORE_CORS,
  database_url: DATABASE_URL,
  admin_cors: ADMIN_CORS,
  database_type: "postgres",
  database_extra:
    process.env.NODE_ENV === "production" || DATABASE_URL.includes("supabase")
      ? {
          ssl: {
            rejectUnauthorized: false
          },
          connectionTimeoutMillis: 10000,
        }
      : {},
  database_logging: process.env.NODE_ENV !== "production" ? ["query", "error"] : ["error"],
};

/** @type {import('@medusajs/medusa').ConfigModule} */
module.exports = {
  projectConfig,
  plugins,
  modules,
};
