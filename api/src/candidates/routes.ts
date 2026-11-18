import { Router } from "express";
import { z } from "zod";
import { currentUserId } from "../middleware/require-session.ts";
import { validate } from "../middleware/validate.ts";
import { searchCandidates } from "./repository.ts";
import { NAME_MAX } from "./schemas.ts";

export const candidatesRouter: Router = Router();

const searchQuery = z.object({
  q: z.string().trim().max(NAME_MAX).default(""),
});

candidatesRouter.get(
  "/",
  validate({ query: searchQuery }),
  async (_req, res) => {
    const { q } = res.locals.query as z.infer<typeof searchQuery>;
    res.json({ candidates: await searchCandidates(currentUserId(res), q) });
  },
);
