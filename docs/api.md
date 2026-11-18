# API

The routes of the Express API, apart from sign-up, login and guest sessions,
which Better Auth serves on `/api/auth/*` (see [auth.md](auth.md)).

## Routes

Every route below needs a signed-in user (a guest counts) and answers with
that user's data only. Errors have one shape:
`{ "error": { "message", "fields"? } }`, where `fields` holds the messages for
each form field.

| Route                         | What                                                                                                               |
| ----------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| `GET /positions`              | The roles a meeting can be for                                                                                     |
| `GET /candidates?q=`          | Up to 10 candidates whose name contains `q`, each with the position and start of their latest meeting              |
| `GET /candidates/:id`         | The candidate page: the candidate, `upcoming` meetings (earliest first) and `history` (newest first)               |
| `PATCH /candidates/:id`       | Changes the candidate's `name` or `notes`                                                                          |
| `GET /meetings`               | One page of meetings, earliest first; `page`, `pageSize`, `q` (candidate name), `status`, `position`, `from`, `to` |
| `GET /meetings/:id`           | One meeting with its candidate, position and feedback                                                              |
| `POST /meetings`              | Books a meeting for an existing candidate (`candidateId`) or a new one (`candidateName`)                           |
| `PATCH /meetings/:id`         | Changes a pending or confirmed meeting that has not started; its candidate cannot change                           |
| `DELETE /meetings/:id`        | Deletes a pending or confirmed meeting that has not started                                                        |
| `POST /meetings/:id/confirm`  | Pending → confirmed                                                                                                |
| `POST /meetings/:id/cancel`   | Pending or confirmed → cancelled                                                                                   |
| `POST /meetings/:id/complete` | Confirmed → completed, only once the meeting has started                                                           |
| `PUT /meetings/:id/feedback`  | Adds the feedback of a completed meeting (`recommendation`, `comment`), or replaces it                             |

`GET /meetings` without `from` starts from now and leaves out cancelled
meetings unless `status=cancelled` is asked for. `from` and `to` are ISO 8601
times with an offset; `to` is exclusive.

On the candidate page, `upcoming` holds pending and confirmed meetings and
`history` completed and cancelled ones. The split is by status, not time: a
meeting that has started but is not marked completed stays in `upcoming`.

## Rules the API keeps

- A meeting starts later than now, when booked and when moved, and ends
  after it starts. An online
  meeting names its platform (Zoom or Google Meet); an onsite one has none.
- One user's pending and confirmed meetings cannot overlap; completed and
  cancelled ones hold no time. Two requests
  at the same moment cannot both get through: the database refuses the
  second, and the API answers 409 (see [database.md](database.md)).
- Completed and cancelled meetings are a record: they cannot be edited or
  deleted, and cancelled and completed are final (see
  [Meeting status](#meeting-status)). So is a meeting that has started: only
  its status can still move (mark it completed, or cancel it).
- A meeting has at most one feedback, added once it is completed: a
  recommendation (strong no, no, yes, strong yes) and an optional comment.
  Saving again replaces it; only the latest version is kept.
- When a guest signs up or logs in, their candidates and meetings move to the
  account. If a moved meeting would overlap one of the account's, the login is
  refused with 409 and they stay a guest, so they can change it and try again.

## Meeting status

```text
pending → confirmed → completed
pending or confirmed → cancelled
confirmed → pending, when its date or time is changed
```

Nothing else moves back. Each move is its own button and its own route; the API
refuses any other move.

- A meeting is confirmed before it is completed, one step at a time, as in a
  ticket workflow.
- Confirmed means the time is agreed. Moving a confirmed meeting sets it back
  to pending, as a new time has to be agreed again; other changes (notes,
  type, platform, position) keep it confirmed.
- Completed is set by hand, and only once the meeting has started, never
  automatically: a meeting can run late. A meeting completed before its booked end
  frees the rest of that time for another booking; its booked times stay as
  they were (see [database.md](database.md#no-double-booking)).
- Cancelled is final. A wrong cancel is fixed by booking again, as in
  scheduling products: [Cal.com](https://cal.com/help/bookings/manage-a-booking.md)
  has no way to bring back a cancelled booking, and the
  [Google Calendar API](https://developers.google.com/workspace/calendar/api/v3/reference/events)
  keeps a cancelled event with the status "cancelled".
- Completed and cancelled meetings, and meetings that have started, are a
  record: they cannot be edited or deleted. Hiring records are kept in case a decision is challenged: the US
  EEOC rule
  ([29 CFR 1602.14](https://www.ecfr.gov/current/title-29/subtitle-B/chapter-XIV/part-1602/subpart-C/section-1602.14))
  keeps them for a year, and the UK ICO
  ([Keeping recruitment records](https://ico.org.uk/for-organisations/uk-gdpr-guidance-and-resources/employment/recruitment-and-selection/keeping-recruitment-records/))
  warns that deleting them too early makes a fair process harder to show.
  Hiring tools such as Greenhouse keep an
  [audit log](https://support.greenhouse.io/hc/en-us/articles/15114917200155-Audit-log-FAQ)
  of changes. Here they are kept forever; a retention period with automatic
  removal is the real-world answer.
