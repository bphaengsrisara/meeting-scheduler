import { expect, test } from "@playwright/test";
import { apiAs } from "./api";

type Position = { id: string; name: string };

// The API's default page size, and one meeting more, so there is a page 2.
const PAGE_SIZE = 10;
const MEETINGS = PAGE_SIZE + 1;
const HOUR_MS = 60 * 60 * 1000;
const MEETING_MS = 30 * 60 * 1000;
// Longer than the search's 300 ms wait, so the list reloads mid-word.
const TYPING_PAUSE_MS = 350;
// Shorter than that wait, so the keys belong to one search; and a delay for
// the first search that ends while those keys are still being typed.
const KEY_GAP_MS = 250;
const SLOW_SEARCH_MS = 600;
// Typed after "fo": long enough (10 keys × 250 ms) that the slow search
// lands in the middle of it.
const MORE_TEXT = "obarbazqux";

// A new guest each run, with one meeting more than a page holds.
test("filter by status and page through the meetings", async ({
  page,
  request,
}) => {
  await page.goto("/login");
  await page.getByRole("button", { name: "Continue as Guest" }).click();
  await expect(page.getByText("No Upcoming Meetings")).toBeVisible();

  const api = await apiAs(page.context(), request);
  const { positions } = await api.get<{ positions: Position[] }>("/positions");
  const tomorrow = new Date();
  tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
  tomorrow.setUTCHours(0, 0, 0, 0);
  for (let i = 0; i < MEETINGS; i++) {
    const start = new Date(tomorrow.getTime() + i * HOUR_MS);
    const { meeting } = await api.post<{ meeting: { id: string } }>(
      "/meetings",
      {
        candidateName: `Candidate ${String(i + 1).padStart(2, "0")}`,
        positionId: positions[0].id,
        startAt: start.toISOString(),
        endAt: new Date(start.getTime() + MEETING_MS).toISOString(),
        type: "on_site",
      },
    );
    if (i === MEETINGS - 1) await api.post(`/meetings/${meeting.id}/confirm`);
  }

  await page.reload();
  const cards = page.locator('[data-slot="card"]');
  await expect(cards).toHaveCount(PAGE_SIZE);

  await expect(page.getByText("Page 1 of 2")).toBeVisible();

  await page.getByRole("link", { name: "Go to next page" }).click();
  await expect(page).toHaveURL(/\?page=2$/);
  await expect(cards).toHaveCount(1);

  await page.getByRole("combobox", { name: "Status" }).click();
  await page.getByRole("option", { name: "Confirmed" }).click();
  await expect(page).toHaveURL(/\?status=confirmed$/);
  await expect(cards).toHaveCount(1);
  await expect(cards.first()).toContainText(`Candidate ${MEETINGS}`);
  await expect(page.getByText("1 filter")).toBeVisible();

  await page.getByRole("button", { name: "Clear All Filters" }).click();
  await expect(page).toHaveURL(/\/$/);
  await expect(cards).toHaveCount(PAGE_SIZE);
});

// Pauses longer than the search wait reload the list while the user types;
// the box must keep every key and its focus.
test("slow typing in the search keeps every key", async ({ page }) => {
  await page.goto("/login");
  await page.getByRole("button", { name: "Continue as Guest" }).click();
  await expect(page.getByText("No Upcoming Meetings")).toBeVisible();
  await page.goto("/?q=x");

  const box = page.getByLabel("Search by candidate name");
  await box.fill("");
  await box.pressSequentially("Jane Doe", { delay: TYPING_PAUSE_MS });

  await expect(page).toHaveURL(/\?q=Jane\+Doe$/);
  await expect(box).toHaveValue("Jane Doe");
  await expect(box).toBeFocused();
});

// A search that finishes after the user has typed more must not put the
// older text back ("fo" arriving while more is being typed).
test("a slow search does not undo newer typing", async ({ page }) => {
  await page.goto("/login");
  await page.getByRole("button", { name: "Continue as Guest" }).click();
  await expect(page.getByText("No Upcoming Meetings")).toBeVisible();
  await page.goto("/?q=x");

  // Only the first search is slow, so it lands in the middle of the typing.
  await page.route(/[?&]q=fo(&|$)/, async (route) => {
    await new Promise((resolve) => setTimeout(resolve, SLOW_SEARCH_MS));
    await route.continue();
  });
  const box = page.getByLabel("Search by candidate name");
  await box.fill("");
  const slowSearchSent = page.waitForRequest(/[?&]q=fo(&|$)/);
  await box.pressSequentially("fo");
  await slowSearchSent;
  await box.pressSequentially(MORE_TEXT, { delay: KEY_GAP_MS });

  await expect(page).toHaveURL(`/?q=fo${MORE_TEXT}`);
  await expect(box).toHaveValue(`fo${MORE_TEXT}`);
});

// Next.js keeps a page the user left; a pop-up left open must not come back
// open, nor stay over the next page.
test("pop-ups are closed after Back and Forward", async ({ page }) => {
  await page.goto("/login");
  await page.getByRole("button", { name: "Continue as Guest" }).click();
  await expect(page.getByText("No Upcoming Meetings")).toBeVisible();
  await page.goto("/?q=x");
  await page.getByRole("link", { name: "Book Meeting" }).click();
  const formTitle = page.getByRole("heading", {
    name: "Schedule a New Meeting",
  });
  await expect(formTitle).toBeVisible();
  await page.goBack();

  await page.getByRole("button", { name: "From – To" }).click();
  await expect(page.getByRole("grid")).toBeVisible();
  await page.goForward();
  await expect(formTitle).toBeVisible();
  await page.goBack();
  await expect(page.getByRole("button", { name: "From – To" })).toBeVisible();
  await expect(page.getByRole("grid")).toBeHidden();

  await page.getByRole("button", { name: "Logout" }).click();
  await expect(page.getByRole("alertdialog")).toBeVisible();
  await page.goForward();
  await expect(formTitle).toBeVisible();
  await expect(page.getByRole("alertdialog")).toBeHidden();
});
