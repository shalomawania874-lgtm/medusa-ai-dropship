const { loadEnv, defineConfig } = require("@medusajs/framework/utils")

loadEnv(process.env.NODE_ENV || "development", process.cwd())

const redisUrl = process.env.REDIS_URL

module.exports = defineConfig({
  projectConfig: {
    databaseUrl: process.env.DATABASE_URL,
    redisUrl,
    workerMode: process.env.MEDUSA_WORKER_MODE || "shared",
    http: {
      storeCors: process.env.STORE_CORS,
      adminCors: process.env.ADMIN_CORS,
      authCors: process.env.AUTH_CORS,
      jwtSecret: process.env.JWT_SECRET,
      cookieSecret: process.env.COOKIE_SECRET,
    },
  },
  admin: {
    disable: process.env.DISABLE_MEDUSA_ADMIN === "true",
  },
  modules: [
    ...(redisUrl ? [
      {
        resolve: "@medusajs/medusa/caching",
        options: { providers: [{ resolve: "@medusajs/caching-redis", id: "caching-redis", is_default: true, options: { redisUrl } }] },
      },
      { resolve: "@medusajs/medusa/event-bus-redis", options: { redisUrl } },
      { resolve: "@medusajs/medusa/workflow-engine-redis", options: { redis: { redisUrl } } },
      {
        resolve: "@medusajs/medusa/locking",
        options: { providers: [{ resolve: "@medusajs/medusa/locking-redis", id: "locking-redis", is_default: true, options: { redisUrl } }] },
      },
    ] : []),
    {
      resolve: "@medusajs/medusa/payment",
      options: {
        providers: [{
          resolve: "medusa-payment-pesapal",
          id: "pesapal",
          options: {
            consumer_key: process.env.PESAPAL_CONSUMER_KEY,
            consumer_secret: process.env.PESAPAL_CONSUMER_SECRET,
            environment: process.env.PESAPAL_ENVIRONMENT || "sandbox",
            currency: process.env.PESAPAL_CURRENCY || "UGX",
            merchant_name: process.env.PESAPAL_MERCHANT_NAME,
            ipn_url: process.env.PESAPAL_IPN_URL,
          },
        }],
      },
    },
    { resolve: "./src/modules/cj/index.js" },
  ],
})
