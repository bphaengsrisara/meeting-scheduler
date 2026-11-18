import { expect, test, type Page } from "@playwright/test";
import { apiAs } from "./api";

const HOUR_MS = 60 * 60 * 1000;

// Tomorrow as the booking form's text box takes it ("2026-11-20"), in the
// browser's time zone, which Playwright takes from this machine.
function tomorrow() {
  const date = new Date();
  date.setDate(date.getDate() + 1);
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

async function fillMeeting(page: Page, name: string, start: string) {
  await page.getByRole("combobox", { name: "Candidate Name" }).fill(name);
  await page
    .getByRole("option", { name: `Add “${name}” as a New Candidate` })
    .click();
  await page.getByRole("combobox", { name: "Position" }).click();
  await page.getByRole("option", { name: "QA Engineer", exact: true }).click();
  await page.getByLabel("Date", { exact: true }).fill(tomorrow());
  await page.getByLabel("Date", { exact: true }).press("Tab");
  // The end time fills itself an hour after the start.
  await page.getByLabel("Start Time", { exact: true }).fill(start);
  await page.getByRole("radio", { name: "Online" }).click();
  await page.getByRole("radio", { name: "Zoom" }).click();
}

// A new guest each run: book, see an overlap refused in the form, edit,
// then delete.
test("book, edit and delete a meeting", async ({ page, request }) => {
  await page.goto("/login");
  await page.getByRole("button", { name: "Continue as Guest" }).click();
  await expect(page.getByText("No Upcoming Meetings")).toBeVisible();

  await page.getByRole("link", { name: "Book Meeting" }).first().click();
  await expect(
    page.getByRole("heading", { name: "Schedule a New Meeting" }),
  ).toBeVisible();
  await fillMeeting(page, "Jan Novak", "10:00");
  await expect(page.getByLabel("End Time", { exact: true })).toHaveValue(
    "11:00",
  );
  await page.getByRole("button", { name: "Book Meeting" }).click();
  await expect(page.getByText("Meeting booked")).toBeVisible();
  await expect(page.getByText("Jan Novak")).toBeVisible();

  // Another person with the same name, at the same hour: the name can still
  // be added as a new candidate, and the form marks the overlap and sends
  // nothing.
  await page.getByRole("link", { name: "Book Meeting" }).click();
  await page
    .getByRole("combobox", { name: "Candidate Name" })
    .fill("Jan Novak");
  await expect(
    page.getByRole("option", { name: /^Jan Novak.*latest meeting/ }),
  ).toBeVisible();
  await fillMeeting(page, "Jan Novak", "10:30");
  await expect(page.getByText("Overlaps", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Book Meeting" }).click();
  await expect(
    page.getByText("This time overlaps your meeting with Jan Novak"),
  ).toBeVisible();

  // No page links to the edit form yet, so the test opens it by its address.
  const api = await apiAs(page.context(), request);
  const { meetings } = await api.get<{ meetings: { id: string }[] }>(
    "/meetings",
  );
  await page.goto(`/meetings/${meetings[0].id}/edit`);
  await page.getByLabel("Notes (optional)").fill("Second round");
  await page.getByRole("button", { name: "Save Changes" }).click();
  await expect(page.getByText("Changes saved")).toBeVisible();

  await page.goto(`/meetings/${meetings[0].id}/edit`);
  await expect(page.getByLabel("Notes (optional)")).toHaveValue("Second round");
  await page.getByRole("button", { name: "Delete Meeting" }).click();
  await page
    .getByRole("alertdialog")
    .getByRole("button", { name: "Delete Meeting" })
    .click();
  await expect(page.getByText("Meeting deleted")).toBeVisible();
  await expect(page.getByText("No Upcoming Meetings")).toBeVisible();
});

// Booked meanwhile (another tab): the form's list did not show it, so the
// database refuses, and the form says so and reloads the day.
test("a time booked meanwhile is refused and the day reloads", async ({
  page,
  request,
}) => {
  await page.goto("/login");
  await page.getByRole("button", { name: "Continue as Guest" }).click();
  await expect(page.getByText("No Upcoming Meetings")).toBeVisible();

  await page.getByRole("link", { name: "Book Meeting" }).first().click();
  await fillMeeting(page, "Jan Novak", "10:00");
  await expect(page.getByText("No other meetings on this day.")).toBeVisible();

  const api = await apiAs(page.context(), request);
  const { positions } = await api.get<{ positions: { id: string }[] }>(
    "/positions",
  );
  const start = new Date(`${tomorrow()}T10:00`);
  await api.post("/meetings", {
    candidateName: "Booked Elsewhere",
    positionId: positions[0].id,
    startAt: start.toISOString(),
    endAt: new Date(start.getTime() + HOUR_MS).toISOString(),
    type: "on_site",
  });

  await page.getByRole("button", { name: "Book Meeting" }).click();
  await expect(
    page.getByText("This time overlaps an existing meeting."),
  ).toBeVisible();
  await expect(page.getByText("(reloaded)")).toBeVisible();
  await expect(
    page.getByText("Booked Elsewhere", { exact: true }),
  ).toBeVisible();
  await expect(page.getByText("Overlaps", { exact: true })).toBeVisible();
});

// "Leave" drops the changes: coming back shows an empty form and no dialog.
// Leaving any other way (the browser's Back) keeps the draft, with the
// dialog closed.
test("leaving the form asks first and closes on return", async ({ page }) => {
  await page.goto("/login");
  await page.getByRole("button", { name: "Continue as Guest" }).click();
  await page.getByRole("link", { name: "Book Meeting" }).first().click();
  const notes = page.getByLabel("Notes (optional)");
  await notes.fill("Draft");

  await page.getByRole("link", { name: "Back" }).click();
  const dialog = page.getByRole("alertdialog");
  await expect(dialog).toContainText("Leave Without Saving?");
  await page.goBack();
  await page.goForward();
  await expect(dialog).toBeHidden();
  await expect(notes).toHaveValue("Draft");

  await page.getByRole("link", { name: "Back" }).click();
  await dialog.getByRole("button", { name: "Leave" }).click();
  await expect(page.getByText("No Upcoming Meetings")).toBeVisible();
  await page.getByRole("link", { name: "Book Meeting" }).first().click();
  await expect(dialog).toBeHidden();
  await expect(notes).toHaveValue("");
});
