import { describe, expect, it } from "vitest";
import { updateCandidateBody } from "./schemas.ts";

describe("updateCandidateBody", () => {
  it("trims the name and stores empty notes as none", () => {
    const body = updateCandidateBody.parse({ name: " Jane Doe ", notes: "  " });

    expect(body).toEqual({ name: "Jane Doe", notes: null });
  });

  it("takes a name and email together, trimmed", () => {
    const body = updateCandidateBody.parse({
      name: "Jane Doe",
      email: " jane.doe@example.com ",
    });

    expect(body).toEqual({ name: "Jane Doe", email: "jane.doe@example.com" });
  });

  it("refuses a blank or invalid email", () => {
    const blank = updateCandidateBody.safeParse({ email: "  " });
    const invalid = updateCandidateBody.safeParse({ email: "jane.doe" });

    expect(blank.error?.issues[0].message).toBe("Enter the candidate's email.");
    expect(invalid.error?.issues[0].message).toBe(
      "Enter a valid email address.",
    );
  });

  it("refuses a blank name", () => {
    const result = updateCandidateBody.safeParse({ name: "   " });

    expect(result.success).toBe(false);
  });

  it("needs something to change", () => {
    const result = updateCandidateBody.safeParse({});

    expect(result.success).toBe(false);
  });
});
