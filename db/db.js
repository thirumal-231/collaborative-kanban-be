import "dotenv/config.js";

import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "../models/schema.js";

const pool = new pg.Pool({
  connectionString: process.env.DB_URL,
});

export const db = drizzle(pool, { schema });
