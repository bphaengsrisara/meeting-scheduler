import "server-only";
import { cookies, headers } from "next/headers";
import { getEnv } from "./env";
import { parseSetCookie } from "./set-cookie";

// Every call to the API goes through here, from the web server only (the
// browser never talks to the API). It adds the shared secret, the browser's
// IP and the browser's cookies, so the API sees who is asking.
export async function callApi(path: string, init: RequestInit = {}) {
  const [requestHeaders, cookieStore] = await Promise.all([
    headers(),
    cookies(),
  ]);
  const env = getEnv();
  const apiHeaders = new Headers(init.headers);
  apiHeaders.set("x-api-secret", env.API_SECRET);

  // The first address is the browser's; proxies add theirs after it.
  const clientIp = requestHeaders.get("x-forwarded-for")?.split(",")[0]?.trim();
  if (clientIp) {
    apiHeaders.set("x-client-ip", clientIp);
  }
  // Better Auth refuses state changes from origins it does not trust.
  const origin = requestHeaders.get("origin");
  if (origin) {
    apiHeaders.set("origin", origin);
  }
  const cookieHeader = cookieStore.toString();
  if (cookieHeader) {
    apiHeaders.set("cookie", cookieHeader);
  }

  return fetch(`${env.API_URL}${path}`, { ...init, headers: apiHeaders });
}

// Sets the cookies from an API response (sign-in, sign-out) on the browser.
// Only a Server Action or Route Handler may set cookies.
export async function copyApiCookies(response: Response) {
  const cookieStore = await cookies();
  for (const header of response.headers.getSetCookie()) {
    const cookie = parseSetCookie(header);
    if (cookie) {
      cookieStore.set(cookie.name, cookie.value, cookie.options);
    }
  }
}

// The answer to a change sent to the API: its JSON when it worked, or what a
// form needs from a refusal (the status, the message, the messages per field).
export type SendResult<T = unknown> =
  | { ok: true; data: T }
  | {
      ok: false;
      status: number;
      message?: string;
      fields?: Record<string, string[]>;
    };

export async function sendToApi<T = unknown>(
  path: string,
  method: string,
  body?: unknown,
): Promise<SendResult<T>> {
  const response = await callApi(path, {
    method,
    headers: body ? { "content-type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  // A 204 (delete) has no body.
  const json = (await response.json().catch(() => ({}))) as {
    error?: { message?: string; fields?: Record<string, string[]> };
  };
  if (response.ok) {
    return { ok: true, data: json as T };
  }
  return {
    ok: false,
    status: response.status,
    message: json.error?.message,
    fields: json.error?.fields,
  };
}
