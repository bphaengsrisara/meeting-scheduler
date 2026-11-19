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

async function fillMeeting(
  page: Page,
  name: string,
  email: string,
  start: string,
) {
  await page.getByRole("combobox", { name: "Candidate Name" }).fill(name);
  await page
    .getByRole("option", { name: `Add “${name}” as a New Candidate` })
    .click();
  // A role query: the login page Next.js keeps hidden has an Email box too.
  await page.getByRole("textbox", { name: "Email" }).fill(email);
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
// then delete. Each save leads to the candidate's page.
test("book, edit and delete a meeting", async ({ page }) => {
  await page.goto("/login");
  await page.getByRole("button", { name: "Continue as Guest" }).click();
  await expect(page.getByText("No Upcoming Meetings")).toBeVisible();

  await page.getByRole("link", { name: "Book Meeting" }).first().click();
  await expect(
    page.getByRole("heading", { name: "Schedule a New Meeting" }),
  ).toBeVisible();
  await fillMeeting(page, "Jan Novak", "jan.novak@example.com", "10:00");
  await expect(page.getByLabel("End Time", { exact: true })).toHaveValue(
    "11:00",
  );
  await page.getByRole("button", { name: "Book Meeting" }).click();
  await expect(page.getByText("Meeting booked")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Jan Novak" })).toBeVisible();

  // Another person with the same name, at the same hour: the list tells the
  // first one apart by email, the name can still be added as a new
  // candidate, and the form marks the overlap and sends nothing.
  await page.goto("/meetings/new");
  await page
    .getByRole("combobox", { name: "Candidate Name" })
    .fill("Jan Novak");
  await expect(
    page.getByRole("option", {
      name: /^Jan Novak.*QA Engineer.*jan\.novak@example\.com · latest meeting/,
    }),
  ).toBeVisible();
  await fillMeeting(page, "Jan Novak", "jan.novak@example.com", "10:30");
  await expect(page.getByText("Overlaps", { exact: true })).toBeVisible();
  // The day's list tells the first Jan Novak apart by email.
  await expect(
    page.getByRole("listitem").getByText("jan.novak@example.com"),
  ).toBeVisible();
  await page.getByRole("button", { name: "Book Meeting" }).click();
  await expect(
    page.getByText("This time overlaps your meeting with Jan Novak"),
  ).toBeVisible();

  // A free time, but the first Jan Novak's email: the API refuses a second
  // candidate with it.
  await page.getByLabel("Start Time", { exact: true }).fill("14:00");
  await page.getByRole("button", { name: "Book Meeting" }).click();
  await expect(
    page.getByText(
      "A candidate with this email already exists. Pick them from the list instead.",
    ),
  ).toBeVisible();

  // The edit form is reached from the candidate's page, and Back returns
  // there.
  await page.goto("/");
  await page.getByRole("link", { name: "View details for Jan Novak" }).click();
  await page.getByRole("link", { name: "Edit Meeting" }).click();
  await page.getByLabel("Notes (optional)").fill("Second round");
  await page.getByRole("button", { name: "Save Changes" }).click();
  await expect(page.getByText("Changes saved")).toBeVisible();
  // The note on the page; the edit form Next.js keeps hidden holds it too.
  await expect(
    page.getByRole("paragraph").filter({ hasText: "Second round" }),
  ).toBeVisible();

  await page.getByRole("link", { name: "Edit Meeting" }).click();
  await expect(page.getByLabel("Notes (optional)")).toHaveValue("Second round");
  await page.getByRole("button", { name: "Delete Meeting" }).click();
  await page
    .getByRole("alertdialog")
    .getByRole("button", { name: "Delete Meeting" })
    .click();
  await expect(page.getByText("Meeting deleted")).toBeVisible();
  await expect(
    page.getByText("No upcoming meetings with Jan Novak."),
  ).toBeVisible();
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
  await fillMeeting(page, "Jan Novak", "jan.novak@example.com", "10:00");
  await expect(page.getByText("No other meetings on this day.")).toBeVisible();

  const api = await apiAs(page.context(), request);
  const { positions } = await api.get<{ positions: { id: string }[] }>(
    "/positions",
  );
  const start = new Date(`${tomorrow()}T10:00`);
  await api.post("/meetings", {
    candidateName: "Booked Elsewhere",
    candidateEmail: "booked.elsewhere@example.com",
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

// One page serves two forms: the plain one and a candidate's. Moving between
// them never carries a candidate, a position or a draft across.
test("the form opens fresh for each candidate", async ({ page }) => {
  await page.goto("/login");
  await page.getByRole("button", { name: "Continue as Guest" }).click();
  await page.getByRole("link", { name: "Book Meeting" }).first().click();
  await fillMeeting(page, "Jan Novak", "jan.novak@example.com", "10:00");
  await page.getByRole("button", { name: "Book Meeting" }).click();
  await expect(page.getByRole("heading", { name: "Jan Novak" })).toBeVisible();

  // The candidate's form: locked to them, their position picked, and it
  // books.
  await page.getByRole("link", { name: "Book Meeting" }).first().click();
  await expect(
    page.getByRole("textbox", { name: "Candidate", exact: true }),
  ).toHaveValue("Jan Novak");
  const position = page.getByRole("combobox", { name: "Position" });
  await expect(position).toHaveText(/QA Engineer/);
  await page.getByLabel("Date", { exact: true }).fill(tomorrow());
  await page.getByLabel("Date", { exact: true }).press("Tab");
  await page.getByLabel("Start Time", { exact: true }).fill("12:00");
  await page.getByRole("radio", { name: "Onsite" }).click();
  await page.getByRole("button", { name: "Book Meeting" }).click();
  await expect(page.getByText("Meeting booked")).toBeVisible();
  await expect(page.getByText(/12:00 PM/)).toBeVisible();

  // The plain form after it: empty.
  await page.getByRole("link", { name: "Dashboard" }).click();
  // The candidate's page has a Book Meeting link too: wait for the dashboard.
  await expect(
    page.getByRole("heading", { name: "Upcoming Meetings" }),
  ).toBeVisible();
  await page.getByRole("link", { name: "Book Meeting" }).first().click();
  await expect(
    page.getByRole("combobox", { name: "Candidate Name" }),
  ).toHaveValue("");
  await expect(position).toHaveText(/Choose a position/);

  // An id that is not one of the user's candidates opens the plain form.
  await page.goto(
    "/meetings/new?candidate=01a1ec1c-0000-7000-8000-000000000000",
  );
  await expect(page).toHaveURL(/\/meetings\/new$/);
  await expect(
    page.getByRole("combobox", { name: "Candidate Name" }),
  ).toHaveValue("");
  await page.goto("/meetings/new?candidate=not-an-id");
  await expect(page).toHaveURL(/\/meetings\/new$/);
});
