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
