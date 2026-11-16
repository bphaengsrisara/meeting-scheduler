import { describe, expect, it } from "vitest";
import { parseSetCookie } from "./set-cookie";

describe("parseSetCookie", () => {
  it("reads a session cookie with its attributes", () => {
    const cookie = parseSetCookie(
      "better-auth.session_token=abc.def%2Bg; Max-Age=604800; Path=/; HttpOnly; SameSite=Lax",
    );

    expect(cookie).toEqual({
      name: "better-auth.session_token",
      value: "abc.def+g",
      options: { maxAge: 604800, path: "/", httpOnly: true, sameSite: "lax" },
    });
  });

  it("reads a cookie that clears the session", () => {
    const cookie = parseSetCookie(
      "better-auth.session_token=; Max-Age=0; Path=/; Secure",
    );

    expect(cookie?.value).toBe("");
    expect(cookie?.options).toEqual({ maxAge: 0, path: "/", secure: true });
  });

  it("leaves out the domain", () => {
    const cookie = parseSetCookie("name=value; Domain=api.example.com");

    expect(cookie?.options).toEqual({});
  });

  it("returns null for a header without a name", () => {
    expect(parseSetCookie("=value")).toBeNull();
  });
});
