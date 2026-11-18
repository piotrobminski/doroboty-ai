import type { Page } from "@playwright/test";
import { TEST_ORIGIN, test, expect, seedScenario, scenario } from "./fixtures";
import AxeBuilder from "@axe-core/playwright";
import { initialState } from "../../src/features/prototype/model";
import { AI_ENDPOINT } from "../../src/features/prototype/ai-contract";

const source =
  "Uporządkujesz obsługę zgłoszeń i skrócisz czas odpowiedzi. Sprawdzisz jakość odpowiedzi. Ważna jest współpraca z zespołem operacyjnym.";
const approvalName = "Sprawdziłem/am opis oraz wybrane pytania do kandydatów.";
async function editor(page: Page) {
  const state = initialState();
  state.activePersonId = "employer-brightlabs";
  await page.goto("/");
  await seedScenario(page, state);
  await page.goto("/#/app/oferty/nowa");
  await page.reload();
}
async function details(page: Page) {
  await page
    .getByLabel("Nazwa stanowiska", { exact: true })
    .fill("Specjalista ds. usprawniania obsługi klienta");
  await page.getByLabel("Ogólny opis stanowiska", { exact: true }).fill(source);
  await page.getByRole("button", { name: "Dalej: umiejętności i pytania →", exact: true }).click();
}
async function reflow(page: Page) {
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  const overflow = await page.locator("main").evaluate((main) =>
    [...main.querySelectorAll<HTMLElement>("p,button,section,label,fieldset,textarea,h3,dd")]
      .filter((el) => {
        const box = el.getBoundingClientRect();
        return (
          box.width > 0 &&
          box.height > 0 &&
          !el.closest(".sr-only") &&
          (box.right > innerWidth + 1 ||
            box.left < -1 ||
            (el.tagName !== "TEXTAREA" && el.scrollWidth > el.clientWidth + 2))
        );
      })
      .map((el) => el.outerHTML.slice(0, 100)),
  );
  expect(overflow).toEqual([]);
}
for (const width of [1280, 390, 320]) {
  test(`guided local proposals, editing, selection, recovery and preview at ${width}px without API`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 900 });
    await editor(page);
    const requests: string[] = [];
    page.on("request", (request) => {
      if (request.url().includes(AI_ENDPOINT) || request.url().includes("openai"))
        requests.push(request.url());
    });
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    // Proposal generation stays local; only persistence calls the application API.
    await page
      .getByRole("button", { name: "Dalej: umiejętności i pytania →", exact: true })
      .click();
    await expect(page.getByLabel("Nazwa stanowiska", { exact: true })).toBeFocused();
    await details(page);
    await expect(
      page.getByRole("heading", { name: "Jakie doświadczenie chcesz poznać?", exact: true }),
    ).toBeVisible();
    await expect(page.locator("main")).not.toContainText(/OpenAI|API|symulacj|local-template/);
    const question = page.getByLabel("Pytanie o własny wkład 1", { exact: true });
    const edited = "Opisz własną zmianę w obsłudze. Co zrobiłeś osobiście i jak sprawdziłeś efekt?";
    await question.fill(edited);
    await expect(page.getByRole("checkbox", { name: approvalName, exact: true })).toHaveCount(0);
    await page.getByRole("button", { name: "Następna umiejętność →", exact: true }).click();
    await expect(page.locator("#skill-name")).toBeFocused();
    await page.getByRole("checkbox", { name: /^Chcę zapytać kandydatów/ }).uncheck();
    await page.getByRole("button", { name: /^1\. Usprawnianie/ }).click();
    await expect(question).toHaveValue(edited);
    await reflow(page);
    await page.screenshot({ path: `artifacts/pr02-guided/step-2-${width}.png`, fullPage: true });
    await page.getByRole("button", { name: "Przejdź do podglądu →", exact: true }).focus();
    await page.keyboard.press("Enter");
    await expect(page.locator(".job-preview")).toContainText(edited);
    await expect(page.locator(".job-preview-question")).toHaveCount(2);
    const reviewed = (await scenario(page)).employerDrafts![0].value.card!.approved;
    expect(reviewed).toBe(true);
    await expect(page.getByRole("checkbox")).toHaveCount(0);
    await page.getByRole("button", { name: "← Wróć do edycji", exact: true }).click();

    await page.reload();
    await expect(page.getByRole("checkbox", { name: approvalName, exact: true })).toHaveCount(0);
    await expect(question).toHaveValue(edited);
    await expect(
      page.getByRole("button", { name: /2\. Sprawdzanie jakości rezultatów · pominięta/ }),
    ).toBeVisible();
    await page.getByRole("button", { name: "Edytuj opis", exact: true }).click();
    await expect(page.getByLabel("Ogólny opis stanowiska", { exact: true })).toHaveValue(source);
    await reflow(page);
    await page.screenshot({ path: `artifacts/pr02-guided/step-1-${width}.png`, fullPage: true });
    await page
      .getByRole("button", { name: "Dalej: umiejętności i pytania →", exact: true })
      .click();
    await page.getByRole("button", { name: "Przejdź do podglądu →", exact: true }).click();
    await reflow(page);
    await page.screenshot({ path: `artifacts/pr02-guided/step-3-${width}.png`, fullPage: true });
    if (width === 1280)
      expect(
        (await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze())
          .violations,
      ).toEqual([]);
    await page.getByRole("button", { name: "Opublikuj ofertę", exact: true }).click();
    const saved = await scenario(page);
    expect(saved.jobs[0].competencyCard!.mode).toBe("local-template");
    expect(saved.jobs[0].competencyCard!.criteria).toHaveLength(2);
    expect(saved.jobs[0].competencyCard!.proposedCriteria).toHaveLength(3);
    expect(saved.employerDrafts).toEqual([]);
    expect(requests).toEqual([]);
    expect(errors).toEqual([]);
  });
}

test("changed source preserves human questions until the recruiter chooses replacement or retention", async ({
  page,
}) => {
  await editor(page);
  await details(page);
  const question = page.getByLabel("Pytanie o własny wkład 1", { exact: true });
  const edited = "Opisz własne działania w zadaniu i wyjaśnij, jak rozpoznałeś skuteczny rezultat.";
  await question.fill(edited);
  await page.getByRole("button", { name: "Edytuj opis", exact: true }).click();
  await page
    .getByLabel("Ogólny opis stanowiska", { exact: true })
    .fill("Analizujesz dane sprzedażowe i przygotowujesz raporty dla odbiorców.");
  await page.getByRole("button", { name: "Dalej: umiejętności i pytania →", exact: true }).click();
  await expect(question).toHaveValue(edited);
  await page.getByRole("button", { name: "Przejdź do podglądu →", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Zachowaj moje pytania dla nowego opisu", exact: true }),
  ).toBeFocused();
  await page
    .getByRole("button", { name: "Przygotuj propozycje dla nowego opisu", exact: true })
    .click();
  await page.getByRole("button", { name: "Anuluj", exact: true }).click();
  await expect(question).toHaveValue(edited);
  await page
    .getByRole("button", { name: "Zachowaj moje pytania dla nowego opisu", exact: true })
    .click();
  await expect(question).toHaveValue(edited);
  await expect(page.getByRole("checkbox", { name: approvalName, exact: true })).toHaveCount(0);
  await expect(page.locator(".job-skill-detail:visible")).not.toContainText("Z Twojego opisu:");
});

test("legacy metadata, multiple locations and EUR/year/net salary survive editing", async ({
  page,
}) => {
  const state = initialState();
  state.activePersonId = "employer-brightlabs";
  const job = state.jobs[0];
  Object.assign(job, {
    locations: ["Warszawa", "Kraków"],
    salaryCurrency: "EUR",
    salaryPeriod: "year",
    salaryKind: "net",
    sourceBrief: "Historyczny brief pozostaje osobno.",
    generatedDescription: "Historyczna propozycja pozostaje osobno.",
    generatedDescriptionModel: "historical-model",
  });
  await page.goto("/");
  await seedScenario(page, state);
  await page.reload();
  await page.goto(`/#/app/oferty/${job.id}`);
  await expect(page.getByLabel("Lokalizacja", { exact: true })).toHaveValue("Warszawa; Kraków");
  await expect(
    page.getByLabel("Wynagrodzenie od (EUR netto / rok)", { exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Dalej: umiejętności i pytania →", exact: true }).click();
  await page.getByRole("button", { name: "Zrezygnuj z dodatkowych pytań", exact: true }).click();
  await page.getByRole("button", { name: "Przejdź do podglądu →", exact: true }).click();
  await expect(page.locator(".job-preview")).toContainText("Warszawa / Kraków");
  await page.getByRole("button", { name: "Opublikuj ofertę", exact: true }).click();
  const result = (await scenario(page)).jobs.find((item) => item.id === job.id);
  expect(result).toMatchObject({
    locations: job.locations,
    salaryCurrency: "EUR",
    salaryPeriod: "year",
    salaryKind: "net",
    sourceBrief: job.sourceBrief,
    generatedDescription: job.generatedDescription,
    generatedDescriptionModel: job.generatedDescriptionModel,
  });
});

test("verification host keeps the real provider unavailable", async ({ page }) => {
  const standalone = !!process.env.PLAYWRIGHT_PRODUCTION_DIR;
  const status = await page.request.get(AI_ENDPOINT);
  if (standalone) expect(status.status()).toBe(404);
  else expect(await status.json()).toMatchObject({ configured: false });
  const response = await page.request.post(AI_ENDPOINT, {
    headers: { Origin: TEST_ORIGIN },
    data: { kind: "criteria", description: source },
  });
  expect(response.status()).toBe(standalone ? 404 : 503);
  if (!standalone) expect(await response.json()).toEqual({ error: "not_configured" });
});
