import { sql } from "drizzle-orm";
import { Router } from "express";
import { db } from "./db/client.ts";

export const healthRouter: Router = Router();

// Healthy only when the database answers too.
healthRouter.get("/health", async (req, res) => {
  try {
    await db.execute(sql`select 1`);
  } catch (err) {
    req.log.error({ err }, "Database check failed");
    res.status(503).json({ error: { message: "Database unavailable" } });
    return;
  }
  res.json({ status: "ok" });
});
