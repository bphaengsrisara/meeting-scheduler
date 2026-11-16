import { describe, expect, it } from "vitest";
import { parseEnv } from "./env.ts";

const databaseUrl = "postgres://postgres:postgres@localhost:5432/test";

describe("parseEnv", () => {
  it("fills the defaults", () => {
    expect(parseEnv({ DATABASE_URL: databaseUrl })).toEqual({
      NODE_ENV: "development",
      PORT: 3001,
      LOG_LEVEL: "info",
      DATABASE_URL: databaseUrl,
    });
  });

  it("rejects a missing DATABASE_URL", () => {
    expect(() => parseEnv({})).toThrow(/DATABASE_URL/);
  });

  it("rejects a DATABASE_URL that is not PostgreSQL", () => {
    expect(() =>
      parseEnv({ DATABASE_URL: "mysql://root@localhost:3306/test" }),
    ).toThrow(/DATABASE_URL/);
  });
});
