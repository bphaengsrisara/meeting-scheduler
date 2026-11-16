import { describe, expect, it } from "vitest";
import { hashPassword, verifyPassword } from "./password.ts";

describe("password", () => {
  it("stores an Argon2id hash with its settings and a random salt", async () => {
    const first = await hashPassword("correct horse");
    const second = await hashPassword("correct horse");

    expect(first).toMatch(/^\$argon2id\$v=19\$m=19456,t=2,p=1\$[^$]+\$[^$]+$/);
    expect(first).not.toBe(second);
  });

  it("accepts the right password and rejects a wrong one", async () => {
    const hash = await hashPassword("correct horse");

    await expect(
      verifyPassword({ hash, password: "correct horse" }),
    ).resolves.toBe(true);
    await expect(
      verifyPassword({ hash, password: "wrong horse" }),
    ).resolves.toBe(false);
  });

  it("rejects a hash that is not Argon2id", async () => {
    await expect(
      verifyPassword({ hash: "salt:hash", password: "correct horse" }),
    ).resolves.toBe(false);
  });
});
