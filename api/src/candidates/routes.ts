import { Router, type Response } from "express";
import { z } from "zod";
import { currentUserId } from "../middleware/require-session.ts";
import { validate } from "../middleware/validate.ts";
import { searchCandidates } from "./repository.ts";
import {
  candidateIdParams,
  NAME_MAX,
  updateCandidateBody,
  type UpdateCandidateBody,
} from "./schemas.ts";
import * as service from "./service.ts";

export const candidatesRouter: Router = Router();

const withId = validate({ params: candidateIdParams });
const idOf = (res: Response) => (res.locals.params as { id: string }).id;

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

candidatesRouter.get("/:id", withId, async (_req, res) => {
  res.json(await service.getCandidatePage(currentUserId(res), idOf(res)));
});

candidatesRouter.patch(
  "/:id",
  withId,
  validate({ body: updateCandidateBody }),
  async (_req, res) => {
    const body = res.locals.body as UpdateCandidateBody;
    const candidate = await service.updateCandidate(
      currentUserId(res),
      idOf(res),
      body,
    );
    res.json({ candidate });
  },
);
