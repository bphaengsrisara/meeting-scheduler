import { existsSync } from "node:fs";
import type { APIRequestContext, BrowserContext } from "@playwright/test";

// Test data goes straight to the API, the way the web server calls it: with
// the shared secret and the browser's session cookie.
if (existsSync(".env")) process.loadEnvFile(".env");
const apiUrl = process.env.API_URL ?? "http://localhost:3001";
const apiSecret = process.env.API_SECRET ?? "";

export async function apiAs(
  context: BrowserContext,
  request: APIRequestContext,
) {
  const cookie = (await context.cookies())
    .map(({ name, value }) => `${name}=${value}`)
    .join("; ");
  const headers = { "x-api-secret": apiSecret, cookie };

  return {
    async get<T>(path: string): Promise<T> {
      const response = await request.get(`${apiUrl}${path}`, { headers });
      return (await response.json()) as T;
    },
    async post<T>(path: string, data?: unknown): Promise<T> {
      const response = await request.post(`${apiUrl}${path}`, {
        headers,
        data,
      });
      if (!response.ok()) throw new Error(`POST ${path}: ${response.status()}`);
      return (await response.json().catch(() => ({}))) as T;
    },
  };
}
