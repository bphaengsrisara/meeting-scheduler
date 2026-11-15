import { expect, test } from "vitest";
import { cn } from "@/lib/utils";

test("cn keeps the last of two conflicting Tailwind classes", () => {
  expect(cn("px-2 py-1", "px-4")).toBe("py-1 px-4");
});
