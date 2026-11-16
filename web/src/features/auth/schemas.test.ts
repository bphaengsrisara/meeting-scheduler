import { describe, expect, it } from "vitest";
import { loginSchema, signupSchema } from "./schemas";

const firstError = (result: { error?: { issues: { message: string }[] } }) =>
  result.error?.issues[0]?.message;

describe("loginSchema", () => {
  it("accepts an email and a password", () => {
    const result = loginSchema.safeParse({
      email: " jane@example.com ",
      password: "x",
    });

    expect(result.data).toEqual({ email: "jane@example.com", password: "x" });
  });

  it("asks for an email address in the right format", () => {
    expect(
      firstError(loginSchema.safeParse({ email: "jane", password: "x" })),
    ).toBe("Enter an email address like name@example.com.");
  });

  it("asks for a password", () => {
    expect(
      firstError(
        loginSchema.safeParse({ email: "jane@example.com", password: "" }),
      ),
    ).toBe("Enter your password.");
  });
});

describe("signupSchema", () => {
  const valid = {
    name: "",
    email: "jane@example.com",
    password: "a".repeat(15),
  };

  it("accepts an empty name", () => {
    expect(signupSchema.safeParse(valid).success).toBe(true);
  });

  it("needs 15 to 64 characters of password", () => {
    expect(
      firstError(
        signupSchema.safeParse({ ...valid, password: "a".repeat(14) }),
      ),
    ).toBe("Use at least 15 characters.");
    expect(
      firstError(
        signupSchema.safeParse({ ...valid, password: "a".repeat(65) }),
      ),
    ).toBe("Use 64 characters or fewer.");
  });
});
