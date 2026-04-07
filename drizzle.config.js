import "dotenv/config.js";

import { defineConfig } from "drizzle-kit";

export default defineConfig({
  dialect: "postgresql",
  schema: "./models/schema.js",
  out: "./drizzle",
  dbCredentials: {
    url: process.env.DB_URL,
  },
});
