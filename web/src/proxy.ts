import { NextResponse, type NextRequest } from "next/server";

// Better Auth's cookie; the __Secure- name is used over HTTPS.
const SESSION_COOKIES = [
  "better-auth.session_token",
  "__Secure-better-auth.session_token",
];

// A quick check only: no session cookie means the login page. Whether the
// session is valid is decided by the API when the page asks for the user.
export function proxy(request: NextRequest) {
  const hasSession = SESSION_COOKIES.some((name) => request.cookies.has(name));
  if (!hasSession) {
    return NextResponse.redirect(new URL("/login", request.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!login|signup|_next/static|_next/image|icon.svg).*)"],
};
