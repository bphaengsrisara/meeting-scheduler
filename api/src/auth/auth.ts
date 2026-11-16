import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { anonymous } from "better-auth/plugins/anonymous";
import { db } from "../db/client.ts";
import * as schema from "../db/schema/auth.ts";
import { env } from "../env.ts";
import { CLIENT_IP_HEADER } from "../middleware/api-secret.ts";
import { hashPassword, verifyPassword } from "./password.ts";

export const auth = betterAuth({
  baseURL: env.BETTER_AUTH_URL,
  secret: env.BETTER_AUTH_SECRET,
  trustedOrigins: [env.WEB_ORIGIN],
  database: drizzleAdapter(db, { provider: "pg", schema }),
  emailAndPassword: {
    enabled: true,
    // NIST SP 800-63B for single-factor passwords; see docs/auth.md.
    minPasswordLength: 15,
    maxPasswordLength: 64,
    // Argon2id instead of Better Auth's default scrypt.
    password: { hash: hashPassword, verify: verifyPassword },
  },
  // "Continue as Guest": a signed-in user with no email or password.
  plugins: [anonymous()],
  advanced: {
    // uuid ids, the same type as owner_id on the app's tables.
    database: { generateId: "uuid" },
    ipAddress: { ipAddressHeaders: [CLIENT_IP_HEADER] },
  },
});
