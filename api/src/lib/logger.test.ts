import { pino } from "pino";
import { describe, expect, it } from "vitest";
import { REDACTED_PATHS } from "./logger.ts";

describe("logger", () => {
  it("redacts the API secret and cookies in request logs", () => {
    const lines: string[] = [];
    const logger = pino(
      { redact: REDACTED_PATHS },
      { write: (line: string) => lines.push(line) },
    );

    // The same shape pino-http logs for each request.
    logger.info({
      req: {
        headers: {
          "x-api-secret": "the-secret",
          cookie: "session=abc",
          host: "api",
        },
      },
      res: { headers: { "set-cookie": ["session=new"] } },
    });

    const output = lines.join("");
    expect(output).not.toContain("the-secret");
    expect(output).not.toContain("session=abc");
    expect(output).not.toContain("session=new");
    expect(JSON.parse(output)).toMatchObject({
      req: {
        headers: {
          "x-api-secret": "[Redacted]",
          cookie: "[Redacted]",
          host: "api",
        },
      },
      res: { headers: { "set-cookie": "[Redacted]" } },
    });
  });
});
