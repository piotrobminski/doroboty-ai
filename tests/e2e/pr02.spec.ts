import type { Page } from "@playwright/test";
import { test, expect, seedScenario, scenario, chooseAccount } from "./fixtures";
import AxeBuilder from "@axe-core/playwright";
import { initialState, transition, type State } from "../../src/features/prototype/model";
import { proposeCriteria, type CompetencyCard } from "../../src/features/prototype/competency";

const description =
  "Projektujesz automatyzację obsługi zgłoszeń z AI.\nAnalizujesz jakość odpowiedzi i błędy modelu.";
const example =
  "Samodzielnie przygotowałam syntetyczny zestaw testowy i porównałam błędy modelu z procesem ręcznym.";
const reason =
  "Kandydatka opisała własną analizę błędów. Na rozmowie sprawdzimy dobór próby i ograniczenia wyniku.";
async function choose(page: Page, name: string) {
  await chooseAccount(page, name);
}
async function seed(page: Page, state: State) {
  await page.goto("/");
  await seedScenario(page, state);
  await page.reload();
}
function withCard() {
  const state = initialState();
  const criteria = proposeCriteria(description);
  const card: CompetencyCard = {
    sourceDescription: description,
    proposedCriteria: criteria,
    criteria,
    mode: "local-template",
    approvedAt: "2026-11-13T10:00:00.000Z",
    approvedBy: "employer-brightlabs",
  };
  state.jobs[0] = { ...state.jobs[0], description, competencyCard: card };
  return state;
}

test("PR02: publish an approved card, resume examples, review evidence and justify a next step", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await choose(page, "Karolina Wiśniewska");
  await page.goto("/#/app/oferty/nowa");
  await page
    .getByLabel("Nazwa stanowiska", { exact: true })
    .fill("PR02 — projektantka automatyzacji");
  await page.getByLabel("Ogólny opis stanowiska", { exact: true }).fill(description);
  await page.getByRole("button", { name: "Dalej: umiejętności i pytania →", exact: true }).click();
  await expect(
    page.getByRole("checkbox", {
      name: "Sprawdziłem/am opis oraz wybrane pytania do kandydatów.",
      exact: true,
    }),
  ).toHaveCount(0);
  await page
    .getByLabel("Umiejętność do sprawdzenia 1", { exact: true })
    .fill("Samodzielne projektowanie automatyzacji z kontrolą jakości.");
  // Remove the third automatic proposal; exercise validation of a new empty question.
  await page.locator(".job-skill-nav button").nth(2).click();
  await page.getByRole("button", { name: "Usuń umiejętność 3", exact: true }).click();
  await page.getByRole("button", { name: "Dodaj umiejętność (maks. 6)", exact: true }).click();
  await page.getByRole("button", { name: "Przejdź do podglądu →", exact: true }).click();
  await expect(page.getByLabel("Umiejętność do sprawdzenia 3", { exact: true })).toBeFocused();
  await page.getByRole("button", { name: "Usuń umiejętność 3", exact: true }).click();
  await page.getByRole("button", { name: "Przejdź do podglądu →", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Tak zobaczy ofertę kandydat", exact: true }),
  ).toBeVisible();
  await expect(page.getByRole("checkbox")).toHaveCount(0);
  await page.getByRole("button", { name: "Opublikuj ofertę", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Moje oferty", exact: true })).toBeVisible();
  const formLink = page.getByRole("link", { name: "Formularz karty PR02", exact: true });
  await formLink.click();
  await chooseAccount(page, "Anna Kowalska");
  await expect(page.getByRole("heading", { name: "Aplikuj na ofertę", exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Wyślij aplikację", exact: true }).click();
  await expect(page.getByLabel("Twój przykład i własny wkład 1", { exact: true })).toBeFocused();
  await page.getByLabel("Twój przykład i własny wkład 1", { exact: true }).fill("Szkic");
  await page.getByRole("button", { name: "Zapisz szkic", exact: true }).click();
  await page.reload();
  await expect(page.getByLabel("Twój przykład i własny wkład 1", { exact: true })).toHaveValue(
    "Szkic",
  );
  await page.getByLabel("Twój przykład i własny wkład 1", { exact: true }).fill(example);
  await page
    .getByLabel("Materiały 1 (opcjonalnie)", { exact: true })
    .fill("https://example.com/synthetic-pr02");
  await page
    .getByLabel("Twój przykład i własny wkład 2", { exact: true })
    .fill(example + " Mój wkład to dobór metryk.");
  await page.getByRole("button", { name: "Wyślij aplikację", exact: true }).click();
  await expect(page.getByRole("checkbox")).toBeFocused();
  await page.getByRole("checkbox").check();
  await page.screenshot({ path: "artifacts/pr02/flow-candidate-1280.png", fullPage: true });
  await page.getByRole("button", { name: "Wyślij aplikację", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Moje aplikacje", exact: true })).toBeVisible();
  await page.getByRole("link", { name: "PR02 — projektantka automatyzacji", exact: true }).click();
  const candidateUrl = page.url();
  const appId = candidateUrl.split("/").at(-1);
  await expect(
    page.getByText("Samodzielne projektowanie automatyzacji z kontrolą jakości.", { exact: true }),
  ).toBeVisible();
  await choose(page, "Karolina Wiśniewska");
  await page.goto(`/#/app/kandydaci/${appId}`);
  await expect(page.getByText(example, { exact: true })).toBeVisible();
  await page.screenshot({ path: "artifacts/pr02/flow-comparison-1280.png", fullPage: true });
  await expect(
    page.getByRole("link", { name: "https://example.com/synthetic-pr02", exact: true }),
  ).toHaveAttribute("href", "https://example.com/synthetic-pr02");
  await page.getByRole("button", { name: "W przeglądzie", exact: true }).click();
  await expect(page.getByLabel("Uzasadnienie następnego kroku", { exact: true })).toBeFocused();
  await page.getByLabel("Uzasadnienie następnego kroku", { exact: true }).fill(reason);
  await page.getByRole("tab", { name: "CV", exact: true }).click();
  await page.getByRole("tab", { name: "Odpowiedź", exact: true }).click();
  await expect(page.getByLabel("Uzasadnienie następnego kroku", { exact: true })).toHaveValue(
    reason,
  );
  await page.getByRole("button", { name: "W przeglądzie", exact: true }).click();
  await expect(page.locator(".record-stage")).toBeFocused();
  await page.reload();
  await expect(page.getByText(reason, { exact: true })).toBeVisible();
  await choose(page, "Anna Kowalska");
  await page.goto(candidateUrl);
  await expect(page.getByText(reason, { exact: true })).toHaveCount(0);
  await expect(page.getByText(example, { exact: true })).toBeVisible();
});

test("source edits revoke card approval and regenerate against the current description", async ({
  page,
}) => {
  const state = withCard();
  state.activePersonId = "employer-brightlabs";
  await seed(page, state);
  await page.goto(`/#/app/oferty/${state.jobs[0].id}`);
  await page.getByRole("button", { name: "Dalej: umiejętności i pytania →", exact: true }).click();
  await page.getByRole("button", { name: "Edytuj opis", exact: true }).click();
  await page
    .getByLabel("Ogólny opis stanowiska", { exact: true })
    .fill("Prowadzisz badania potrzeb użytkowników i przygotowujesz prototypy narzędzi.");
  await page.getByRole("button", { name: "Dalej: umiejętności i pytania →", exact: true }).click();
  await page.getByRole("button", { name: "Przejdź do podglądu →", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Zachowaj moje pytania dla nowego opisu", exact: true }),
  ).toBeFocused();
  await page
    .getByRole("button", { name: "Przygotuj propozycje dla nowego opisu", exact: true })
    .click();
  await page.getByRole("button", { name: "Przygotuj nowe propozycje", exact: true }).click();
  await expect(page.locator("#skill-name")).toBeFocused();
  await expect(page.getByLabel("Umiejętność do sprawdzenia 1", { exact: true })).toHaveValue(
    "Rozpoznawanie potrzeb użytkowników",
  );
  await page.getByRole("button", { name: "Przejdź do podglądu →", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Tak zobaczy ofertę kandydat", exact: true }),
  ).toBeVisible();
});

test("changed or removed cards keep previous draft examples recoverable and person-specific", async ({
  page,
}) => {
  let state = withCard();
  state.activePersonId = "candidate-anna";
  const oldCard = state.jobs[0].competencyCard!;
  const oldExample =
    "Wcześniej opisany własny wkład, który pozostaje dostępny po zmianie kryteriów.";
  state.drafts.push({
    candidateId: "candidate-anna",
    jobId: state.jobs[0].id,
    notes: "Legacy source",
    generated: "Legacy copy",
    answer: "",
    competencyRevision: oldCard.approvedAt,
    competencyResponses: oldCard.criteria.map((criterion) => ({
      criterionId: criterion.id,
      example: oldExample,
      materials: "Poprzedni materiał",
    })),
  });
  const criteria = proposeCriteria(description);
  state.jobs[0].competencyCard = {
    ...oldCard,
    criteria,
    proposedCriteria: criteria,
    approvedAt: "2026-11-13T11:00:00.000Z",
  };
  await seed(page, state);
  const applyPath = `/#/aplikuj/${state.jobs[0].slug}`;
  await page.goto(applyPath);
  await expect(
    page.getByText("Karta kryteriów zmieniła się od zapisu szkicu.", { exact: false }),
  ).toBeVisible();
  await page.getByText("Przykłady z poprzedniej wersji karty (2)", { exact: true }).click();
  await expect(page.getByText(oldExample, { exact: true }).first()).toBeVisible();
  await choose(page, "Marek Nowak");
  await page.goto(applyPath);
  await expect(page.getByText(oldExample, { exact: true })).toHaveCount(0);
  await choose(page, "Anna Kowalska");
  await page.goto(applyPath);
  await page.getByLabel("Twój przykład i własny wkład 1", { exact: true }).fill(example);
  await page.getByLabel("Twój przykład i własny wkład 2", { exact: true }).fill(example);
  await page.getByLabel("Materiały 1 (opcjonalnie)", { exact: true }).fill("javascript:alert(1)");
  await page.getByRole("button", { name: "Zapisz szkic", exact: true }).click();
  await page.reload();
  state = await scenario(page);
  expect(state.drafts[0].competencyResponses).toHaveLength(4);
  const removed = structuredClone(state);
  delete removed.jobs[0].competencyCard;
  await seed(page, removed);
  await page.goto(applyPath);
  await expect(
    page.getByText("Przykłady z poprzedniej wersji karty (4)", { exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Zapisz szkic", exact: true }).click();
  await page.reload();
  expect((await scenario(page)).drafts[0].competencyResponses!.length).toBe(4);
  await seed(page, state);
  await page.goto(applyPath);
  await page.getByRole("checkbox").check();
  await page.getByRole("button", { name: "Wyślij aplikację", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Moje aplikacje", exact: true })).toBeVisible();
  const saved: State = await scenario(page);
  const submitted = saved.applications.at(-1)!;
  expect(submitted.competency?.responses).toHaveLength(2);
  expect(submitted.sourceNotes).toBe("Legacy source");
  expect(submitted.generatedAnswer).toBe("Legacy copy");
  await page.goto(`/#/app/aplikacje/${submitted.id}`);
  await expect(page.getByText("javascript:alert(1)", { exact: true })).toBeVisible();
  await expect(page.locator('a[href^="javascript:"]')).toHaveCount(0);
});

for (const width of [1280, 390, 320]) {
  test(`PR02 editor, candidate and comparison reflow with long/missing content at ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 900 });
    let state = withCard();
    state.jobs[0].competencyCard!.criteria[0].requirement = "BardzoDługieWymaganieBezSpacji".repeat(
      20,
    );
    state.activePersonId = "employer-brightlabs";
    await seed(page, state);
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.goto(`/#/app/oferty/${state.jobs[0].id}`);
    await page
      .getByRole("button", { name: "Dalej: umiejętności i pytania →", exact: true })
      .click();
    await expect(page.getByLabel("Umiejętność do sprawdzenia 1", { exact: true })).toBeVisible();
    await checkLayout(page);
    await page.screenshot({ path: `artifacts/pr02/editor-${width}.png`, fullPage: true });
    state.activePersonId = "candidate-anna";
    await seed(page, state);
    await page.goto(`/#/aplikuj/${state.jobs[0].slug}`);
    await expect(page.getByLabel("Twój przykład i własny wkład 1", { exact: true })).toBeVisible();
    await checkLayout(page);
    await page.screenshot({ path: `artifacts/pr02/candidate-${width}.png`, fullPage: true });
    const card = state.jobs[0].competencyCard!;
    state = transition(
      state,
      {
        type: "submit",
        jobId: state.jobs[0].id,
        notes: "",
        generated: "",
        answer: "",
        consent: true,
        competencyRevision: card.approvedAt,
        competencyResponses: card.criteria.map((criterion) => ({
          criterionId: criterion.id,
          example,
          materials: "",
        })),
      },
      "2026-11-13T11:00:00.000Z",
      "application-pr02",
    );
    state.activePersonId = "employer-brightlabs";
    await seed(page, state);
    await page.goto("/#/app/kandydaci/application-pr02");
    await expect(page.getByText("Nie dodano materiałów.").first()).toBeVisible();
    await checkLayout(page);
    await page.screenshot({ path: `artifacts/pr02/comparison-${width}.png`, fullPage: true });
    if (width === 1280)
      expect(
        (await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze())
          .violations,
      ).toEqual([]);
    expect(errors).toEqual([]);
  });
}

async function checkLayout(page: Page) {
  await page.evaluate(() => document.fonts.ready);
  const overflow = await page.locator("main").evaluate((main) =>
    [
      ...main.querySelectorAll<HTMLElement>(
        "h1,h2,h3,h4,p,section,fieldset,form,button,label,textarea,.competency-comparison",
      ),
    ]
      .filter((element) => {
        const rect = element.getBoundingClientRect();
        return (
          rect.width > 0 &&
          rect.height > 0 &&
          !element.closest(".sr-only") &&
          (rect.right > innerWidth + 1 ||
            rect.left < -1 ||
            (element.tagName !== "TEXTAREA" && element.scrollWidth > element.clientWidth + 2))
        );
      })
      .map((element) => element.outerHTML.slice(0, 150)),
  );
  expect(overflow).toEqual([]);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
}
