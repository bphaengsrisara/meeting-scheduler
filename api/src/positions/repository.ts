import { asc } from "drizzle-orm";
import { db } from "../db/client.ts";
import { position } from "../db/schema/app.ts";

export function listPositions() {
  return db
    .select({ id: position.id, name: position.name })
    .from(position)
    .orderBy(asc(position.name));
}
