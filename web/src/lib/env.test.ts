import { afterEach, describe, expect, it, vi } from "vitest";

// server-only refuses to load outside the server build; the tests are neither.
vi.mock("server-only", () => ({}));

// A fresh module each time, so no checked value is kept between tests.
async function loadGetEnv() {
  vi.resetModules();
  return (await import("./env")).getEnv;
}

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("getEnv", () => {
  it("loads without the variables, as next build does", async () => {
    vi.stubEnv("API_SECRET", undefined);

    await expect(loadGetEnv()).resolves.toBeTypeOf("function");
  });

  it("throws on first use when API_SECRET is missing", async () => {
    vi.stubEnv("API_SECRET", undefined);
    const getEnv = await loadGetEnv();

    expect(() => getEnv()).toThrow(/API_SECRET/);
  });

  it("returns the values, with the default API_URL", async () => {
    vi.stubEnv("API_SECRET", "a".repeat(32));
    vi.stubEnv("API_URL", undefined);
    const getEnv = await loadGetEnv();

    expect(getEnv()).toEqual({
      API_SECRET: "a".repeat(32),
      API_URL: "http://localhost:3001",
    });
  });
});
