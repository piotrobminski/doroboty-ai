import { expect, seedScenario, signIn, test } from "./fixtures";
import { ARCHIVE_DELAY_MS, initialState } from "../../src/features/prototype/model";

test("employer closes recruitment and authorized users can read the archived offer and applications", async ({
  page,
}) => {
  const state = initialState();
  const job = state.jobs[0];
  const application = state.applications[0];
  await signIn(page, "employer-brightlabs");
  await page.goto("/#/app/oferty");
  const offer = page
    .locator("article")
    .filter({ has: page.getByRole("link", { name: job.title, exact: true }) });
  const close = offer.getByRole("button", { name: "Zakończ rekrutację", exact: true });
  await expect(close).toBeDisabled();
  await offer.getByRole("link", { name: "Aplikacje (1)", exact: true }).click();
  await page.getByRole("link", { name: application.candidateName, exact: true }).click();
  await page.getByRole("button", { name: "Proces zakończony", exact: true }).click();
  await expect(page.locator(".record-stage")).toHaveText("Proces zakończony");
  await page.goto("/#/app/oferty");
  await close.focus();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("alertdialog")).toContainText("Po 90 dniach");
  await page.keyboard.press("Escape");
  await expect(close).toBeFocused();
  await page.keyboard.press("Enter");
  await page
    .getByRole("alertdialog")
    .getByRole("button", { name: "Zakończ rekrutację", exact: true })
    .click();
  await expect(offer.getByText("Rekrutacja zakończona", { exact: true })).toBeFocused();
  await expect(offer.getByText(/Archiwizacja:/)).toBeVisible();
  await page.goto(`/#/aplikuj/${job.slug}`);
  await signIn(page, "candidate-anna");
  await page.reload();
  await expect(page.getByRole("heading", { name: "Nie znaleziono strony" })).toBeVisible();

  const date = new Date(Date.now() - ARCHIVE_DELAY_MS - 60_000).toISOString();
  const submittedAt = new Date(Date.parse(date) - 60_000).toISOString();
  job.publicationStatus = "hidden";
  job.recruitmentClosedAt = date;
  job.title =
    "Długie archiwalne ogłoszenie o projektowaniu procesów i automatyzacji obsługi klientów";
  delete job.salaryMin;
  delete job.salaryMax;
  application.stage = "rejected";
  application.events = [
    { stage: "submitted", at: submittedAt, note: "" },
    { stage: "rejected", at: date, note: "Notatka firmy z zakończenia." },
  ];
  state.activePersonId = "employer-brightlabs";
  await seedScenario(page, state);
  await page.goto("/#/app/oferty");
  await page.reload();
  await expect(page.getByRole("link", { name: job.title, exact: true })).toHaveCount(0);
  await page.getByRole("link", { name: "Archiwum ofert" }).click();
  await page.getByRole("link", { name: job.title, exact: true }).click();
  await expect(page.getByRole("heading", { name: job.title })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Co będzie na Twoim biurku" })).toBeVisible();
  await expect(page.getByText("Nie podano wynagrodzenia")).toBeVisible();
  for (const width of [1280, 390, 320]) {
    await page.setViewportSize({ width, height: 900 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
    await page.screenshot({
      path: `artifacts/recruitment-archiving/offer-${width}.png`,
      fullPage: true,
    });
  }
  await page.getByRole("link", { name: "Zobacz aplikacje w archiwum" }).click();
  await expect(page.getByRole("link", { name: "Archiwum aplikacji" })).toHaveAttribute(
    "aria-current",
    "page",
  );
  await page.getByRole("link", { name: application.candidateName, exact: true }).click();
  await expect(page.getByText("Archiwalna", { exact: true })).toBeVisible();
  await expect(page.getByText("Notatka firmy z zakończenia.")).toBeVisible();
  await page.getByRole("tab", { name: "CV", exact: true }).click();
  await expect(page.getByRole("link", { name: "Pobierz CV (PDF)" })).toBeVisible();
  await expect(page.getByRole("button", { name: "W przeglądzie", exact: true })).toHaveCount(0);
  await signIn(page, "candidate-marek");
  await page.goto("/#/app/aplikacje");
  await page.reload();
  await expect(page.getByRole("link", { name: application.jobTitle, exact: true })).toHaveCount(0);
  await page.getByRole("link", { name: "Archiwum aplikacji" }).click();
  await page.getByRole("link", { name: application.jobTitle, exact: true }).click();
  await expect(page.getByText("Archiwalna", { exact: true })).toBeVisible();
  await expect(page.getByText("Notatka firmy z zakończenia.")).toHaveCount(0);
});
