import "server-only";
import { cookies, headers } from "next/headers";
import { env } from "./env";
import { parseSetCookie } from "./set-cookie";

// Every call to the API goes through here, from the web server only (the
// browser never talks to the API). It adds the shared secret, the browser's
// IP and the browser's cookies, so the API sees who is asking.
export async function callApi(path: string, init: RequestInit = {}) {
  const [requestHeaders, cookieStore] = await Promise.all([
    headers(),
    cookies(),
  ]);
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
