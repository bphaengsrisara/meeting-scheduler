import { APIError } from "better-auth/api";
import type { AnonymousOptions } from "better-auth/plugins/anonymous";
import { moveCandidates } from "../candidates/repository.ts";
import { EXCLUSION_VIOLATION, findPgError } from "../lib/pg-error.ts";

type LinkGuest = NonNullable<AnonymousOptions["onLinkAccount"]>;

export const GUEST_OVERLAP_MESSAGE =
  "Some of your guest meetings overlap meetings in this account. Change or cancel them, then log in again.";

// A guest signed up or logged in: their candidates and meetings move to the
// account. Better Auth runs this after the login and before it deletes the guest.
export const linkGuest: LinkGuest = async ({ anonymousUser, newUser, ctx }) => {
  try {
    await moveCandidates(anonymousUser.user.id, newUser.user.id);
  } catch (err) {
    if (findPgError(err)?.code !== EXCLUSION_VIOLATION) throw err;
    // Undo the login, so the browser keeps its guest cookie and the guest
    // can fix the overlap. The headers are typed on Better Auth's hooks only.
    (ctx.context as { responseHeaders?: Headers }).responseHeaders?.delete(
      "set-cookie",
    );
    await ctx.context.internalAdapter.deleteSession(newUser.session.token);
    throw new APIError("CONFLICT", { message: GUEST_OVERLAP_MESSAGE });
  }
};
