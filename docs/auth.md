# Authentication

Sign-up, login and guest sessions run in the API through Better Auth, on
`/api/auth/*`. Its data lives in this project's PostgreSQL database.

## How it is mounted

`api/src/app.ts` mounts Better Auth with
`app.all("/api/auth/*splat", toNodeHandler(auth))`, the form its
[Express guide](https://www.better-auth.com/docs/integrations/express) gives
for Express 5, and before any body parser such as `express.json()`, as the
guide requires.

## Passwords

Passwords are hashed with Argon2id through Node.js's built-in
[`crypto.argon2`](https://nodejs.org/docs/latest-v26.x/api/crypto.html), in
`api/src/auth/password.ts`, instead of Better Auth's default scrypt.

The settings are the minimum that the
[OWASP Password Storage Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html)
gives for Argon2id: 19 MiB of memory, 2 passes, 1 degree of parallelism. In
Node's terms that is `memory: 19456` (1 KiB blocks), `passes: 2`,
`parallelism: 1`. Each password gets a random 16-byte salt.

Each hash is stored in the
[PHC string format](https://c2sp.org/phc-strings), which carries the settings
and the salt with it:

```text
$argon2id$v=19$m=19456,t=2,p=1$<salt>$<hash>
```

So the settings can be raised later: new hashes use the new values, and
existing hashes are still checked with the values stored in them.

## Better Auth's tables

Better Auth requires four tables, `user`, `session`, `account` and
`verification`, and checks at startup that the schema has the columns it uses;
their names can be changed
([Database](https://www.better-auth.com/docs/concepts/database)). With the
Drizzle adapter it does not create them itself: its CLI writes them as a
Drizzle schema, and drizzle-kit turns that into a migration. The default names
are kept.

`api/src/db/schema/auth.ts` holds that schema. Its CLI wrote the file:

```bash
cd api
pnpm dlx auth@1.7.25 generate --config src/auth/auth.ts --output src/db/schema/auth.ts
```

It was then edited by hand: every timestamp is `timestamptz`, so times are
stored in UTC. Run the CLI again only after changing
Better Auth's config or plugins, then redo that edit and create a migration
with `pnpm --filter api db:generate`.
