import type { Page } from "@playwright/test";
import { test, expect, seedScenario } from "./fixtures";
import AxeBuilder from "@axe-core/playwright";
import { initialState, transition, type State } from "../../src/features/prototype/model";
import { proposeJobSkills } from "../../src/features/prototype/job-proposals";

const description =
  "Usprawniasz obsługę zgłoszeń klientów. Sprawdzasz jakość odpowiedzi. Współpracujesz z zespołem operacyjnym.";
const examples = [
  "Samodzielnie opracowałam nowy proces obsługi zgłoszeń klientów. Wdrożyłam podział zgłoszeń na kategorie. Czas odpowiedzi skrócił się z 12 do 8 godzin.",
  "W zespole rozmawiamy o jakości odpowiedzi i testach. Chcę nauczyć się więcej na ten temat.",
  "Przygotowałam plan współpracy z zespołem operacyjnym. Osobiście przeprowadziłam warsztat. Efektem było przyjęcie nowej procedury przez 4 osoby.",
];
function submitted() {
  let state = initialState();
  state.activePersonId = "employer-brightlabs";
  const criteria = proposeJobSkills(description);
  const card = {
    sourceDescription: description,
    proposedCriteria: criteria,
    criteria,
    mode: "local-template" as const,
    approvedBy: "employer-brightlabs",
    approvedAt: "2026-11-13T12:00:00.000Z",
  };
  state = transition(state, {
    type: "publish",
    job: { ...state.jobs[0], description, competencyCard: card },
  });
  state.activePersonId = "candidate-anna";
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
      competencyResponses: criteria.map((item, index) => ({
        criterionId: item.id,
        example: examples[index],
        materials: "https://example.com/synthetic-evidence",
      })),
    },
    "2026-11-13T12:10:00.000Z",
    "insight-example",
  );
  state.activePersonId = "employer-brightlabs";
  return state;
}
async function seed(page: Page, state: State) {
  await page.goto("/");
  await seedScenario(page, state);
  await page.reload();
}
async function noOverflow(page: Page) {
  const overflowing = await page.locator("main").evaluate((main) =>
    [...main.querySelectorAll<HTMLElement>("p,h3,h4,section,summary,blockquote,span,button")]
      .filter((element) => {
        const rect = element.getBoundingClientRect();
        return (
          rect.width > 0 &&
          rect.height > 0 &&
          !element.closest(".sr-only") &&
          (rect.right > innerWidth + 1 ||
            rect.left < -1 ||
            element.scrollWidth > element.clientWidth + 2)
        );
      })
      .map((element) => element.outerHTML.slice(0, 120)),
  );
  expect(overflowing).toEqual([]);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
}
for (const width of [1280, 390, 320]) {
  test(`employer evidence hint uses submitted snapshots and remains accessible at ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.emulateMedia({ reducedMotion: "reduce" });
    const state = submitted();
    // Current job/profile edits cannot rewrite the submitted evidence.
    state.jobs[0].description =
      "Analizujesz zupełnie inne zadania i dane w nowym opisie stanowiska.";
    delete state.jobs[0].competencyCard;
    state.people.find((person) => person.id === "candidate-anna")!.cv =
      "Zmieniony profil nie jest źródłem analizy.";
    await seed(page, state);
    const api: string[] = [];
    page.on("request", (request) => {
      if (
        request.url().includes("/api/recruiter-ai") ||
        request.url().includes("openai.com") ||
        request.url().includes("example.com")
      )
        api.push(request.url());
    });
    await page.goto("/#/app/kandydaci/insight-example");
    const panel = page.getByRole("region", {
      name: "Zgodność odpowiedzi z wymaganiami",
      exact: true,
    });
    await expect(panel).toBeVisible();
    await expect(panel).toContainText("2 z 3 odpowiedzi");
    await expect(panel.locator('[data-evidence-status="described"]')).toHaveCount(2);
    await expect(panel.locator('[data-evidence-status="partial"]')).toHaveCount(1);
    await expect(panel).not.toContainText("Zmieniony profil");
    const disclosure = panel.locator("summary").first();
    await disclosure.focus();
    await page.keyboard.press("Enter");
    await expect(disclosure).toBeFocused();
    await expect(panel.locator("blockquote").first()).toContainText("Samodzielnie opracowałam");
    await noOverflow(page);
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.screenshot({ path: `artifacts/pr02-insight/record-${width}.png`, fullPage: true });
    if (width === 1280)
      expect(
        (await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze())
          .violations,
      ).toEqual([]);
    await page.getByRole("button", { name: "W przeglądzie", exact: true }).click();
    await expect(page.getByLabel("Uzasadnienie następnego kroku", { exact: true })).toBeFocused();
    await page.getByRole("tab", { name: "CV", exact: true }).click();
    await expect(panel).not.toBeVisible();
    await page.getByRole("tab", { name: "Odpowiedź", exact: true }).click();
    await expect(panel).toContainText("2 z 3 odpowiedzi");
    await page.reload();
    await expect(panel).toContainText("2 z 3 odpowiedzi");
    expect(api).toEqual([]);
  });
}

test("candidate, unrelated employer and ordinary applications never receive the evidence hint", async ({
  page,
}) => {
  let state = submitted();
  state.activePersonId = "candidate-anna";
  await seed(page, state);
  await page.goto("/#/app/aplikacje/insight-example");
  await expect(page.getByText("Podpowiedź AI", { exact: true })).toHaveCount(0);
  await expect(page.getByText(examples[0], { exact: true })).toBeVisible();
  state.activePersonId = "employer-northstar";
  await seed(page, state);
  await page.goto("/#/app/kandydaci/insight-example");
  await expect(
    page.getByRole("heading", { name: "Nie znaleziono strony", exact: true }),
  ).toBeVisible();
  await expect(page.locator(".competency-insight")).toHaveCount(0);
  state = initialState();
  state.activePersonId = "employer-brightlabs";
  await seed(page, state);
  await page.goto("/#/app/kandydaci/application-example");
  await expect(page.locator(".competency-insight")).toHaveCount(0);
});

test("long and unrelated answers show cautious gaps instead of positive matching claims", async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 900 });
  const state = submitted();
  const app = state.applications.at(-1)!;
  app.competency!.card.criteria[0].requirement = "BardzoDługieNiestandardoweWymaganie".repeat(20);
  app.competency!.card.criteria[0].sourceExcerpt = undefined;
  app.competency!.responses[0].example = "BardzoDługiNiepowiązanyPrzykładBezSpacji".repeat(100);
  await seed(page, state);
  await page.goto("/#/app/kandydaci/insight-example");
  await expect(page.locator('[data-evidence-status="unclear"]')).toHaveCount(1);
  await noOverflow(page);
  await page.screenshot({ path: "artifacts/pr02-insight/long-320.png", fullPage: true });
});
