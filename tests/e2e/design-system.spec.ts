import type { Page } from "@playwright/test";
import { test, expect, seedScenario } from "./fixtures";
import AxeBuilder from "@axe-core/playwright";
import { initialState, type State } from "../../src/features/prototype/model";

async function seed(page: Page, person: string | null, edit?: (state: State) => void) {
  const state = initialState();
  state.activePersonId = person;
  edit?.(state);
  await page.goto("/");
  await seedScenario(page, state);
  await page.reload();
}

async function reflow(page: Page) {
  await page.evaluate(() => document.fonts.ready);
  const overflowing = await page.locator("main").evaluate((main) => {
    const width = innerWidth;
    return [
      ...main.querySelectorAll<HTMLElement>(
        "h1,h2,h3,p,article,section,form,button,label,dl,dd,input,textarea,[role=combobox],.company-mark,.record-sheet",
      ),
    ]
      .filter((element) => {
        const rect = element.getBoundingClientRect();
        const style = getComputedStyle(element);
        return (
          rect.width > 0 &&
          rect.height > 0 &&
          style.visibility !== "hidden" &&
          style.clip === "auto" &&
          !element.closest('[aria-hidden="true"], .sr-only') &&
          (rect.right > width + 1 ||
            rect.left < -1 ||
            (!["INPUT", "TEXTAREA"].includes(element.tagName) &&
              element.scrollWidth > element.clientWidth + 2))
        );
      })
      .map((element) => ({
        tag: element.tagName,
        class: element.className,
        text: element.textContent?.slice(0, 70),
      }));
  });
  expect(overflowing).toEqual([]);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
}

for (const width of [1280, 390, 320]) {
  test(`all product routes share the new system and reflow at ${width}px`, async ({ page }) => {
    test.setTimeout(120_000);
    await page.setViewportSize({ width, height: 900 });
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    const firstJob = initialState().jobs[0];
    const routes: [string, string | null, string][] = [
      ["home", null, "/"],
      ["settings-unselected", null, "/app/settings"],
      ["signup-alias", null, "/auth/sign-up"],
      ["onboarding-redirect", "candidate-anna", "/app/onboarding"],
      ["missing-job", null, "/oferty/not-found"],
      ["missing-company", null, "/firmy/not-found"],
      ["employer-no-candidates", "employer-northstar", "/app/kandydaci"],
      ["listing", null, "/oferty"],
      ["map", null, "/oferty?view=map"],
      ["no-results", null, "/oferty?query=nieistniejącarola"],
      ["offer", null, `/oferty/${firstJob.slug}`],
      ["company", null, "/firmy/brightlabs"],
      ["methodology", null, "/metodologia"],
      ["privacy", null, "/polityka-prywatnosci"],
      ["personas", null, "/auth/sign-in"],
      ["unavailable", null, "/nie-ma-takiej-strony"],
      ["candidate-home", "candidate-anna", "/app"],
      ["profile", "candidate-anna", "/app/profil"],
      ["profile-preview", "candidate-anna", "/app/profil/podglad"],
      ["saved-empty", "candidate-anna", "/app/zapisane"],
      ["applications-empty", "candidate-anna", "/app/aplikacje"],
      ["apply", "candidate-anna", `/aplikuj/${firstJob.slug}`],
      ["candidate-settings", "candidate-anna", "/app/settings"],
      ["applications", "candidate-marek", "/app/aplikacje"],
      ["candidate-record", "candidate-marek", "/app/aplikacje/application-example"],
      ["submitted-record", "candidate-marek", "/app/aplikacje/application-example/wyslano"],
      ["employer-home", "employer-brightlabs", "/app"],
      ["employer-jobs", "employer-brightlabs", "/app/oferty"],
      ["new-job", "employer-brightlabs", "/app/oferty/nowa"],
      ["edit-job", "employer-brightlabs", `/app/oferty/${firstJob.id}`],
      ["organization", "employer-brightlabs", "/app/organizacja"],
      ["candidates", "employer-brightlabs", "/app/kandydaci"],
      ["employer-record", "employer-brightlabs", "/app/kandydaci/application-example"],
      ["employer-settings", "employer-brightlabs", "/app/settings"],
      ["case", "primary-admin", "/app/case"],
      ["operator-settings", "primary-admin", "/app/settings"],
      ["admin", "primary-admin", "/app/admin"],
      ["wrong-role", "candidate-anna", "/app/oferty"],
      ["wrong-person", "candidate-anna", "/app/aplikacje/application-example"],
    ];
    for (const [name, person, route] of routes) {
      await test.step(name, async () => {
        await seed(page, person);
        await page.goto(`/#${route}`);
        await expect(page.locator("main")).not.toBeEmpty();
        await reflow(page);
        await expect(page.locator("body")).toHaveCSS("background-color", "rgb(247, 245, 237)");
        await expect(page.getByRole("heading", { level: 1 })).toHaveCount(1);
        await page.screenshot({
          path: `artifacts/technologia-po-ludzku/${name}-${width}.png`,
          fullPage: true,
        });
        if (width === 1280 && !name.startsWith("wrong-")) {
          const audit = await new AxeBuilder({ page })
            .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
            .analyze();
          expect(
            audit.violations.map(({ id, nodes }) => ({
              id,
              targets: nodes.map((node) => node.target),
            })),
          ).toEqual([]);
        }
      });
    }
    expect(errors).toEqual([]);
  });
}

test("company cards share candidate saved state and valid definition-list structure", async ({
  page,
}) => {
  await seed(page, "candidate-anna");
  await page.goto("/#/firmy/brightlabs");
  const save = page.getByRole("button", { name: "Zapisz ofertę: AI Product Manager", exact: true });
  await save.click();
  await expect(save).toHaveAttribute("aria-pressed", "true");
  await page.reload();
  await expect(save).toHaveAttribute("aria-pressed", "true");
  await page.goto("/#/app/zapisane");
  await expect(
    page.getByRole("heading", { name: "AI Product Manager", exact: true }),
  ).toBeVisible();
  await page.goto("/#/firmy/brightlabs");
  expect(
    await page
      .locator(".company-facts dl")
      .evaluate((dl) =>
        [...dl.children].every(
          (group) =>
            group.tagName === "DIV" &&
            group.querySelector(":scope > dt") &&
            group.querySelector(":scope > dd"),
        ),
      ),
  ).toBe(true);
});

test("public navigation and select portals retain keyboard focus at 320px", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 700 });
  await page.goto("/#/oferty");
  const menu = page.getByRole("button", { name: "Otwórz nawigację", exact: true });
  await menu.focus();
  await page.keyboard.press("Enter");
  const dialog = page.getByRole("dialog", { name: "Dokąd teraz?", exact: true });
  await expect(dialog).toBeVisible();
  for (let i = 0; i < 9; i++) await page.keyboard.press("Tab");
  expect(await dialog.evaluate((el) => el.contains(document.activeElement))).toBe(true);
  await page.keyboard.press("Escape");
  await expect(menu).toBeFocused();
  const select = page.getByRole("combobox", { name: "Tryb pracy", exact: true });
  await select.focus();
  await page.keyboard.press("Space");
  await expect(page.getByRole("listbox")).toBeVisible();
  await page.keyboard.press("End");
  await page.keyboard.press("Enter");
  await expect(select).toContainText("Zdalnie");
  await expect(select).toBeFocused();
  await page.keyboard.press("Space");
  await page.keyboard.press("Escape");
  await expect(select).toBeFocused();
  await reflow(page);
});

test("long and missing job/company data, empty company and saved states keep complete content", async ({
  page,
}) => {
  await seed(page, "candidate-anna", (state) => {
    state.jobs[0].title = "BardzoDługiTytułStanowiska".repeat(7);
    state.jobs[0].locations = ["BardzoDługaLokalizacja".repeat(6)];
    delete state.jobs[0].salaryMin;
    delete state.jobs[0].salaryMax;
    state.companies[0].name = "BardzoDługaNazwaFirmy".repeat(8);
    state.companies[0].logoUrl = "/company-logos/brak-pliku.png";
    state.companies.push({
      ...state.companies[0],
      id: "empty-company",
      slug: "empty-company",
      name: "Firma bez ofert",
    });
    state.saved.push({ candidateId: "candidate-anna", jobId: state.jobs[0].id });
  });
  for (const width of [1280, 390, 320]) {
    await page.setViewportSize({ width, height: 900 });
    for (const [name, route] of [
      ["long-listing", "/oferty"],
      ["long-offer", "/oferty/ai-product-manager"],
      ["long-company", "/firmy/brightlabs"],
      ["saved", "/app/zapisane"],
      ["empty-company", "/firmy/empty-company"],
    ]) {
      await page.goto(`/#${route}`);
      await reflow(page);
      await page.screenshot({
        path: `artifacts/technologia-po-ludzku/${name}-${width}.png`,
        fullPage: true,
      });
    }
  }
  await page.goto("/#/oferty/ai-product-manager");
  await expect(page.getByText("Nie podano wynagrodzenia", { exact: true })).toBeVisible();
});

test("employer salary error identifies and focuses the field without losing approved text", async ({
  page,
}) => {
  const job = initialState().jobs[0];
  await seed(page, "employer-brightlabs");
  await page.goto(`/#/app/oferty/${job.id}`);
  await page.locator('[name="salaryMin"]').fill("50000");
  await page.locator('[name="salaryMax"]').fill("10000");
  await page.getByRole("button", { name: "Dalej: umiejętności i pytania →", exact: true }).click();
  await expect(page.getByRole("alert")).toContainText("Górna kwota");
  await expect(page.locator('[name="salaryMax"]')).toBeFocused();
  await expect(page.locator('[name="salaryMax"]')).toHaveAttribute("aria-invalid", "true");
  await expect(page.getByLabel("Ogólny opis stanowiska", { exact: true })).toHaveValue(
    job.description,
  );
  await page.locator('[name="salaryMax"]').fill("60000");
  await expect(page.getByRole("alert")).toHaveCount(0);
});
