import type { NextRequest } from "next/server";
import { callApi } from "@/lib/api";

// The booking form's candidate suggestions, asked by the browser as the user
// types. Reads go through a Route Handler, not a Server Action: Next.js runs
// Server Actions one at a time, which suits saving, not searching.
export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get("q") ?? "";
  const response = await callApi(`/candidates?${new URLSearchParams({ q })}`);
  return Response.json(await response.json(), { status: response.status });
}
