import { APIError } from "better-auth/api";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { moveCandidates } from "../candidates/repository.ts";
import { GUEST_OVERLAP_MESSAGE, linkGuest } from "./link-guest.ts";

// The database is mocked: these tests cover what the hook does with its answer.
vi.mock("../candidates/repository.ts", () => ({ moveCandidates: vi.fn() }));

const deleteSession = vi.fn();
let responseHeaders: Headers;

// What Better Auth passes after a guest logs in to an existing account.
async function link() {
  await linkGuest({
    anonymousUser: { user: { id: "guest" } },
    newUser: { user: { id: "account" }, session: { token: "new-token" } },
    ctx: { context: { responseHeaders, internalAdapter: { deleteSession } } },
  } as unknown as Parameters<typeof linkGuest>[0]);
}

beforeEach(() => {
  vi.clearAllMocks();
  responseHeaders = new Headers({
    "set-cookie": "better-auth.session_token=new",
  });
});

describe("linkGuest", () => {
  it("moves the guest's candidates to the account", async () => {
    await link();

    expect(moveCandidates).toHaveBeenCalledWith("guest", "account");
    expect(responseHeaders.get("set-cookie")).not.toBeNull();
  });

  it("refuses the login with 409 when a moved meeting would overlap", async () => {
    const overlap = Object.assign(new Error(), { code: "23P01" });
    vi.mocked(moveCandidates).mockRejectedValue(
      new Error("Failed query", { cause: overlap }),
    );

    const error = await link().catch((err: unknown) => err);

    expect(error).toBeInstanceOf(APIError);
    expect(error).toMatchObject({
      statusCode: 409,
      message: GUEST_OVERLAP_MESSAGE,
    });
    // The browser keeps its guest cookie, and the new session is gone.
    expect(responseHeaders.get("set-cookie")).toBeNull();
    expect(deleteSession).toHaveBeenCalledWith("new-token");
  });

  it("lets any other database error through", async () => {
    vi.mocked(moveCandidates).mockRejectedValue(new Error("connection lost"));

    await expect(link()).rejects.toThrow("connection lost");
    expect(deleteSession).not.toHaveBeenCalled();
  });
});
