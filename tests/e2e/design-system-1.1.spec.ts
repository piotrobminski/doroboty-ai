import type { Page } from "@playwright/test";
import { test, expect, seedScenario } from "./fixtures";
import { readFileSync } from "node:fs";
import { initialState } from "../../src/features/prototype/model";

const profile = JSON.parse(
  readFileSync("docs/design-system/technologia-po-ludzku/agent-kit/host-profiles.json", "utf8"),
);
async function seed(page: Page, person: string) {
  const state = initialState();
  state.activePersonId = person;
  await page.goto("/");
  await seedScenario(page, state);
  await page.reload();
}

test("1.1 skill-selection target and field geometry follow the frozen profile at all widths", async ({
  page,
}) => {
  for (const width of [1280, 390, 320]) {
    await seed(page, "employer-brightlabs");
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/#/app/oferty/nowa");
    await page.getByLabel("Nazwa stanowiska", { exact: true }).fill("Sprawdzanie formularza");
    await page
      .getByLabel("Ogólny opis stanowiska", { exact: true })
      .fill("Sprawdzasz jakość odpowiedzi i rozwiązujesz problemy zespołu.");
    await expect(page.locator(".ui-input").first()).toHaveCSS(
      "border-radius",
      `${profile.geometry.fieldRadius}px`,
    );
    await expect(page.locator(".ui-select-trigger").first()).toHaveCSS(
      "padding-right",
      `${profile.geometry.selectRightPadding}px`,
    );
    await page
      .getByRole("button", { name: "Dalej: umiejętności i pytania →", exact: true })
      .click();
    const consent = page.getByRole("checkbox", {
      name: "Chcę zapytać kandydatów o tę umiejętność.",
      exact: true,
    });
    const label = consent.locator("xpath=ancestor::label");
    expect((await label.boundingBox())!.height).toBeGreaterThanOrEqual(
      profile.geometry.comfortableTarget,
    );
    await label.click();
    await expect(consent).not.toBeChecked();
    await page.getByRole("button", { name: "Przejdź do podglądu →", exact: true }).focus();
    await expect(consent).not.toBeChecked();
  }
});

test("1.1 shared cards have unique heading names and retain focus and identity when saved", async ({
  page,
}) => {
  await seed(page, "candidate-anna");
  for (const route of ["/", "/oferty", "/firmy/brightlabs"]) {
    await page.goto(`/#${route}`);
    const cards = page.locator(".tph-job-card");
    const ids = await cards.evaluateAll((cards) =>
      cards.map((card) => card.getAttribute("aria-labelledby")),
    );
    expect(ids.every(Boolean)).toBe(true);
    expect(new Set(ids).size).toBe(ids.length);
    const card = page.getByRole("article", { name: "AI Product Manager", exact: true });
    await expect(card).toBeVisible();
    const button = card.getByRole("button", {
      name: "Zapisz ofertę: AI Product Manager",
      exact: true,
    });
    const id = await card.getAttribute("aria-labelledby");
    await button.focus();
    await page.keyboard.press("Space");
    await expect(button).toBeFocused();
    await expect(card).toHaveAttribute("aria-labelledby", id!);
  }
});

test("1.1 criteria display canonical labels while retaining enum URLs and keyboard recovery", async ({
  page,
}) => {
  for (const width of [1280, 390, 320]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto(
      "/#/oferty?query=Product&category=build&remote=remote&seniority=senior&contract=employment",
    );
    for (const label of ["Product", "Build", "Zdalnie", "Senior", "Umowa o pracę"])
      await expect(
        page.getByRole("button", { name: `Usuń filtr: ${label}`, exact: true }),
      ).toBeVisible();
    await page.reload();
    const remote = page.getByRole("button", { name: "Usuń filtr: Zdalnie", exact: true });
    await remote.focus();
    await page.keyboard.press("Enter");
    await expect(page).not.toHaveURL(/remote=/);
    await expect(page).toHaveURL(/contract=employment/);
    await expect(page).toHaveURL(/seniority=senior/);
    expect(
      await page.evaluate(() => document.activeElement?.classList.contains("tph-filter-chip")),
    ).toBe(true);
  }
});
