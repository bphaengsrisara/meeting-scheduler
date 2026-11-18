import { describe, expect, it } from "vitest";
import { parseEnv } from "./env.ts";

const required = {
  DATABASE_URL: "postgres://postgres:postgres@localhost:5432/test",
  BETTER_AUTH_SECRET: "a".repeat(32),
  API_SECRET: "b".repeat(32),
};

describe("parseEnv", () => {
  it("fills the defaults", () => {
    expect(parseEnv(required)).toEqual({
      NODE_ENV: "development",
      PORT: 3001,
      LOG_LEVEL: "info",
      BETTER_AUTH_URL: "http://localhost:3001",
      WEB_ORIGIN: "http://localhost:3000",
      RATE_LIMIT_PER_MINUTE: 100,
      ...required,
    });
  });

  it("rejects a missing DATABASE_URL", () => {
    expect(() => parseEnv({ ...required, DATABASE_URL: undefined })).toThrow(
      /DATABASE_URL/,
    );
  });

  it("rejects a DATABASE_URL that is not PostgreSQL", () => {
    expect(() =>
      parseEnv({
        ...required,
        DATABASE_URL: "mysql://root@localhost:3306/test",
      }),
    ).toThrow(/DATABASE_URL/);
  });

  it.each(["BETTER_AUTH_SECRET", "API_SECRET"])(
    "rejects a %s shorter than 32 characters",
    (name) => {
      expect(() => parseEnv({ ...required, [name]: "too-short" })).toThrow(
        new RegExp(name),
      );
    },
  );
});
