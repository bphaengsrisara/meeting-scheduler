import { argon2, randomBytes, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";

const argon2Async = promisify(argon2);

// OWASP's minimum Argon2id settings; see docs/auth.md.
const MEMORY_KIB = 19456;
const PASSES = 2;
const PARALLELISM = 1;
const TAG_LENGTH = 32;

// Returns $argon2id$v=19$m=19456,t=2,p=1$<salt>$<hash> (see docs/auth.md).
export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16);
  const hash = await argon2Async("argon2id", {
    message: password,
    nonce: salt,
    memory: MEMORY_KIB,
    passes: PASSES,
    parallelism: PARALLELISM,
    tagLength: TAG_LENGTH,
  });
  const settings = `m=${MEMORY_KIB},t=${PASSES},p=${PARALLELISM}`;
  return `$argon2id$v=19$${settings}$${salt.toString("base64")}$${hash.toString("base64")}`;
}

export async function verifyPassword({
  hash,
  password,
}: {
  hash: string;
  password: string;
}): Promise<boolean> {
  const [, algorithm, , settings, salt, expected] = hash.split("$");
  if (algorithm !== "argon2id" || !settings || !salt || !expected) {
    return false;
  }
  const { m, t, p } = Object.fromEntries(
    settings.split(",").map((pair) => pair.split("=")),
  );
  const expectedBytes = Buffer.from(expected, "base64");
  const actual = await argon2Async("argon2id", {
    message: password,
    nonce: Buffer.from(salt, "base64"),
    memory: Number(m),
    passes: Number(t),
    parallelism: Number(p),
    tagLength: expectedBytes.length,
  });
  // Constant time, so the comparison does not leak how many bytes matched.
  return timingSafeEqual(actual, expectedBytes);
}
