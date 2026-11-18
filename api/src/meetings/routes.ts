import { Router, type Response } from "express";
import { currentUserId } from "../middleware/require-session.ts";
import { validate } from "../middleware/validate.ts";
import {
  createMeetingBody,
  feedbackBody,
  listMeetingsQuery,
  meetingIdParams,
  updateMeetingBody,
  type CreateMeetingBody,
  type FeedbackBody,
  type ListMeetingsQuery,
  type UpdateMeetingBody,
} from "./schemas.ts";
import * as service from "./service.ts";

export const meetingsRouter: Router = Router();

const withId = validate({ params: meetingIdParams });
const idOf = (res: Response) => (res.locals.params as { id: string }).id;

// The dashboard: search, filters and one page at a time.
meetingsRouter.get(
  "/",
  validate({ query: listMeetingsQuery }),
  async (_req, res) => {
    const query = res.locals.query as ListMeetingsQuery;
    res.json(await service.listMeetings(currentUserId(res), query));
  },
);

meetingsRouter.get("/:id", withId, async (_req, res) => {
  const meeting = await service.getMeeting(currentUserId(res), idOf(res));
  res.json({ meeting });
});

meetingsRouter.post(
  "/",
  validate({ body: createMeetingBody }),
  async (_req, res) => {
    const body = res.locals.body as CreateMeetingBody;
    const meeting = await service.createMeeting(currentUserId(res), body);
    res.status(201).json({ meeting });
  },
);

meetingsRouter.patch(
  "/:id",
  withId,
  validate({ body: updateMeetingBody }),
  async (_req, res) => {
    const body = res.locals.body as UpdateMeetingBody;
    const meeting = await service.updateMeeting(
      currentUserId(res),
      idOf(res),
      body,
    );
    res.json({ meeting });
  },
);

meetingsRouter.delete("/:id", withId, async (_req, res) => {
  await service.deleteMeeting(currentUserId(res), idOf(res));
  res.status(204).end();
});

// Status changes, one route per move: confirm, cancel, complete.
for (const move of ["confirm", "cancel", "complete"] as const) {
  meetingsRouter.post(`/:id/${move}`, withId, async (_req, res) => {
    const meeting = await service.moveStatus(
      currentUserId(res),
      idOf(res),
      move,
    );
    res.json({ meeting });
  });
}

// Adds the feedback of a completed meeting, or replaces it.
meetingsRouter.put(
  "/:id/feedback",
  withId,
  validate({ body: feedbackBody }),
  async (_req, res) => {
    const body = res.locals.body as FeedbackBody;
    const meeting = await service.saveFeedback(
      currentUserId(res),
      idOf(res),
      body,
    );
    res.json({ meeting });
  },
);
