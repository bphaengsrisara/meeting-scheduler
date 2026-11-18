import { expect, test } from "@playwright/test";
import { apiAs } from "./api";

type Position = { id: string; name: string };

const SECOND_MS = 1000;
const HOUR_MS = 60 * 60 * 1000;
// A meeting can only be booked in the future and completed once it has
// started, so the first one starts this soon after it is booked.
const STARTS_IN_MS = 3 * SECOND_MS;

// A new guest each run: confirm, complete and review one meeting, cancel
// another, and fix the name and notes, all from the candidate's page.
test("confirm, complete and add feedback on the candidate page", async ({
  page,
  request,
}) => {
  await page.goto("/login");
  await page.getByRole("button", { name: "Continue as Guest" }).click();
  await expect(page.getByText("No Upcoming Meetings")).toBeVisible();

  const api = await apiAs(page.context(), request);
  const { positions } = await api.get<{ positions: Position[] }>("/positions");
  const soon = new Date(Date.now() + STARTS_IN_MS);
  const { meeting } = await api.post<{
    meeting: { candidate: { id: string } };
  }>("/meetings", {
    candidateName: "Ana Lima",
    positionId: positions[0].id,
    startAt: soon.toISOString(),
    endAt: new Date(soon.getTime() + HOUR_MS).toISOString(),
    type: "on_site",
  });
  const later = new Date(Date.now() + 24 * HOUR_MS);
  await api.post("/meetings", {
    candidateId: meeting.candidate.id,
    positionId: positions[0].id,
    startAt: later.toISOString(),
    endAt: new Date(later.getTime() + HOUR_MS).toISOString(),
    type: "online",
    platform: "zoom",
  });

  await page.reload();
  await page
    .getByRole("link", { name: "View details for Ana Lima" })
    .first()
    .click();
  await expect(page.getByRole("heading", { name: "Ana Lima" })).toBeVisible();

  await page.getByRole("button", { name: "Confirm Meeting" }).first().click();
  await expect(page.getByText("Meeting confirmed")).toBeVisible();
  // Mark Completed shows only once the meeting has started.
  await expect(async () => {
    await page.reload();
    await expect(
      page.getByRole("button", { name: "Mark Completed" }),
    ).toBeVisible({ timeout: SECOND_MS });
  }).toPass();
  await expect(page.getByText("This meeting has started.")).toBeVisible();
  await page.getByRole("button", { name: "Mark Completed" }).click();
  await expect(page.getByText("No feedback yet")).toBeVisible();

  await page.getByRole("button", { name: "Add Feedback" }).click();
  const dialog = page.getByRole("dialog");
  await dialog.getByRole("button", { name: "Save Feedback" }).click();
  await expect(dialog.getByText("Choose a recommendation.")).toBeVisible();
  await dialog.getByRole("radio", { name: "Yes", exact: true }).click();
  await dialog.getByLabel("Comment (optional)").fill("Clear answers.");
  await dialog.getByRole("button", { name: "Save Feedback" }).click();
  await expect(page.getByText("Recommendation: Yes")).toBeVisible();
  await expect(dialog).toBeHidden();
  await expect(page.getByText("Clear answers.")).toBeVisible();

  // Closing after a change asks first.
  await page.getByRole("button", { name: "Edit Feedback" }).click();
  await dialog.getByRole("radio", { name: "Strong Yes" }).click();
  await dialog.getByRole("button", { name: "Close" }).click();
  const discard = page.getByRole("alertdialog");
  await expect(discard).toContainText("Discard This Feedback?");
  await discard.getByRole("button", { name: "Discard" }).click();
  await expect(page.getByText("Recommendation: Yes")).toBeVisible();

  await page.getByRole("button", { name: "Cancel Meeting" }).click();
  await page
    .getByRole("alertdialog")
    .getByRole("button", { name: "Cancel Meeting" })
    .click();
  await expect(
    page.getByText("Book again to fix a wrong cancel."),
  ).toBeVisible();
  await expect(
    page.getByText("No upcoming meetings with Ana Lima."),
  ).toBeVisible();

  await page.getByRole("button", { name: "Edit Name" }).click();
  await dialog.getByLabel("Full Name").fill("Ana Lima Souza");
  await dialog.getByRole("button", { name: "Save Name" }).click();
  await expect(
    page.getByRole("heading", { name: "Ana Lima Souza" }),
  ).toBeVisible();

  const notes = page.getByRole("textbox", { name: "Interview Notes" });
  await notes.fill("Strong on SQL.");
  await page.getByRole("button", { name: "Save Notes" }).click();
  await expect(page.getByText("Notes saved")).toBeVisible();
  await notes.fill("Strong on SQL, ask about tests.");
  await expect(page.getByText("Notes saved")).toBeHidden();
});

test("a candidate that is not the user's is not found", async ({ page }) => {
  await page.goto("/login");
  await page.getByRole("button", { name: "Continue as Guest" }).click();
  await expect(page.getByText("No Upcoming Meetings")).toBeVisible();

  await page.goto("/candidates/01a1ec1c-0000-7000-8000-000000000000");
  await expect(
    page.getByRole("heading", { name: "Candidate Not Found" }),
  ).toBeVisible();
  await page.getByRole("link", { name: "Go to Dashboard" }).click();
  await expect(page.getByText("No Upcoming Meetings")).toBeVisible();
});
