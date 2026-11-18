# Meeting Scheduler

A small web app for scheduling candidate interview meetings: create, list,
edit and delete meetings.

The requirements are in [docs/requirements.md](docs/requirements.md). How
sign-up, login and password hashing work is in [docs/auth.md](docs/auth.md). The
design (desktop and mobile screens, components and the screen flow) is in
[Figma](https://www.figma.com/design/ekxNHHuT2jLA3T7qVPf9Vo), view only.

## Status

Work in progress. The web app has login, sign-up and "Continue as Guest",
the Upcoming Meetings page: the user's meetings as cards, with search,
filters (status, position, dates) and pages, all kept in the URL, and the
booking form to book, edit and delete a meeting. The form lists the user's
other meetings on the picked day and marks any that overlap before sending.
Each card opens the candidate page: the meetings still to happen with their
status buttons (confirm, mark completed, cancel), interview notes, and the
history with each interview's feedback. The API has sign-up, login
and guest sessions through Better Auth, and the routes for positions,
candidates and meetings, including the candidate page's data and feedback.

## Layout

| Path    | What                                                    |
| ------- | ------------------------------------------------------- |
| `web/`  | Frontend: Next.js (App Router), TypeScript              |
| `api/`  | Backend: Express 5, TypeScript, run directly by Node.js |
| `docs/` | Requirements, authentication, API routes, database      |

`compose.yaml` runs PostgreSQL 18 for local work.

The two apps share one pnpm workspace.

## Run locally

Needs Node.js 26 (see `.nvmrc`), pnpm and Docker.

```bash
pnpm install
docker compose up -d db              # PostgreSQL on localhost:5432
cp api/.env.example api/.env
cp web/.env.example web/.env
pnpm --filter api db:migrate         # create the tables
pnpm --filter web dev   # http://localhost:3000
pnpm --filter api dev   # http://localhost:3001/health
```

The API reads `api/.env` if it exists; `api/.env.example` lists the
variables. `DATABASE_URL`, `BETTER_AUTH_SECRET` and `API_SECRET` are
required; the others have defaults. They are checked at startup, and the API
stops with a clear message if one is invalid. `GET /health` answers 503 when
the database is down.

The web app reads `web/.env` (Next.js loads it): `API_URL` (default
`http://localhost:3001`) and `API_SECRET`, which must be the same as the
API's.

Only the web app's server calls the API. Every route except `/health` needs
the `x-api-secret` header with `API_SECRET`; the web server also sends the
browser's IP in `x-client-ip`, which the rate limits use.

## Database

The tables are defined in TypeScript in `api/src/db/schema/`. After changing
them, `pnpm --filter api db:generate` writes a new SQL migration into
`api/drizzle/`, and `pnpm --filter api db:migrate` applies it.

Two migrations are written by hand (`drizzle-kit generate --custom`):
`0002_no-double-booking.sql` adds the constraint that stops one user's
meetings from overlapping, which Drizzle cannot declare, and
`0003_positions.sql` fills the position list. There is no screen to edit
positions.

Why the database keeps these rules, and how, is in
[docs/database.md](docs/database.md).

## API routes

The routes, their query rules and the rules the API keeps are in
[docs/api.md](docs/api.md).

## API structure

| Path               | What                                                                                |
| ------------------ | ----------------------------------------------------------------------------------- |
| `src/index.ts`     | Starts the server                                                                   |
| `src/app.ts`       | Builds the Express app (used by the tests as well)                                  |
| `src/env.ts`       | Checks the environment variables with Zod                                           |
| `src/middleware/`  | API secret check, rate limit, session check, Zod validation, 404 and error handlers |
| `src/auth/`        | Better Auth setup (`/api/auth/*`), Argon2id hashing, the hook that moves guest data |
| `src/meetings/`    | Meeting routes, rules (`service.ts`), queries (`repository.ts`), Zod schemas        |
| `src/candidates/`  | Candidate search, the candidate page's data, name, email and notes changes          |
| `src/positions/`   | The position list                                                                   |
| `src/lib/`         | Logger, the HTTP error type, PostgreSQL error codes                                 |
| `src/db/client.ts` | Connection pool (pg) and the Drizzle client                                         |
| `src/db/schema/`   | Table definitions: Better Auth's in `auth.ts`, the app's in `app.ts`                |
| `drizzle/`         | SQL migrations written by drizzle-kit                                               |
| `src/health.ts`    | `GET /health`, which also checks the database                                       |

## Web structure

| Path                       | What                                                                                                                                                                                     |
| -------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/app/`                 | Routes (Next.js App Router): `(auth)/` for login and sign-up, `(app)/` for signed-in pages with the header                                                                               |
| `src/features/auth/`       | Login and sign-up forms, their Zod rules, the Server Actions that call the API, logout, the guest notice; a signed-in user (not a guest) is sent from login and sign-up to the dashboard |
| `src/features/meetings/`   | The Upcoming Meetings page's parts (cards, filters, pages, empty states, the URL ↔ API query) and the booking form (its rules in `booking.ts`, its Server Actions in `actions.ts`)       |
| `src/features/candidates/` | The candidate page's parts: meeting rows, status buttons, interview notes, the Edit Details and feedback dialogs, and their Server Actions                                               |
| `src/app/api/`             | Two GET Route Handlers the booking form calls from the browser: candidate suggestions and the day's meetings. Saving goes through Server Actions                                         |
| `src/lib/dates.ts`         | The date and time formats, in the user's time zone (date-fns with @date-fns/tz)                                                                                                          |
| `src/lib/time-zone*`       | The browser puts its time zone in a cookie; the server reads it to show local times                                                                                                      |
| `src/lib/api.ts`           | The only way to call the API: adds the secret, the browser's IP and cookies; copies the API's cookies back                                                                               |
| `src/lib/session.ts`       | Reads the signed-in user from the API (`requireUser()` sends others to `/login`)                                                                                                         |
| `src/lib/env.ts`           | Checks the environment variables with Zod                                                                                                                                                |
| `src/proxy.ts`             | Sends a browser with no session cookie to `/login`                                                                                                                                       |
| `src/components/`          | The header, the logo, and shadcn/ui components in `ui/`                                                                                                                                  |
| `src/lib/utils.ts`         | `cn()`, which merges class names for shadcn/ui components                                                                                                                                |
| `components.json`          | shadcn/ui settings (Base UI primitives)                                                                                                                                                  |
| `e2e/`                     | End-to-end tests with Playwright; `api.ts` creates test data through the API                                                                                                             |

## Check the code

Run from the repository root:

```bash
pnpm lint        # Prettier check, then ESLint in api and web
pnpm lint:fix    # ESLint --fix in api and web, then Prettier rewrite (last, so lint passes)
pnpm typecheck   # TypeScript check in api and web
pnpm test        # Tests with Vitest in api and web (api needs the database up, and Docker for Testcontainers)
pnpm test:e2e    # End-to-end tests with Playwright; starts the API and web (database up)
pnpm build       # Production build of web (the API runs its TypeScript directly, no build)
pnpm verify      # All of it in order: lint:fix, typecheck, test, build, test:e2e; stops at the first failure
```

Playwright needs its browser once:
`pnpm --filter web exec playwright install chromium --only-shell`.

Prettier has one config for both apps, `.prettierrc.json` at the root. A
formatting problem makes `pnpm lint` fail; `pnpm lint:fix` fixes it. Each
root script names the apps it runs in, so an app that is missing the script
makes the command fail instead of being skipped. Both apps' ESLint configs
add typescript-eslint's strict rules and SonarJS.
