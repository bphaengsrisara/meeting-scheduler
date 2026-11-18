import { Router } from "express";
import { listPositions } from "./repository.ts";

export const positionsRouter: Router = Router();

// The booking form's dropdown and the dashboard's position filter.
positionsRouter.get("/", async (_req, res) => {
  res.json({ positions: await listPositions() });
});
