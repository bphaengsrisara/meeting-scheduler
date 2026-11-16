import { expect, it } from "vitest";
import { initials } from "./initials";

it.each([
  ["Jane Doe", "jane@example.com", "JD"],
  ["Mary Ann Lee", "mary@example.com", "ML"],
  ["Cher", "cher@example.com", "C"],
  ["  ", "alex@example.com", "A"],
  ["", "alex@example.com", "A"],
])("initials(%j, %j) is %j", (name, email, expected) => {
  expect(initials(name, email)).toBe(expected);
});
