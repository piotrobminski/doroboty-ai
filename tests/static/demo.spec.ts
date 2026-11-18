import { test, expect, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { readFile } from "node:fs/promises";
const key = "doroboty.static-demo.v1";
const apiRequests = new WeakMap<Page, string[]>();
async function login(page: Page, id: string) {
  await page.goto("/#/auth/sign-in");
  await page.getByLabel("Adres e-mail", { exact: true }).fill(`${id}@doroboty.test`);
  await page.getByLabel("Hasło", { exact: true }).fill("Test1234");
  await page.getByRole("button", { name: "Zaloguj się", exact: true }).click();
  await expect(page).not.toHaveURL(/#\/auth\//);
}
test.beforeEach(async ({ page }) => {
  const paths: string[] = [];
  apiRequests.set(page, paths);
  page.on("request", (request) => {
    if (new URL(request.url()).pathname.startsWith("/api/")) paths.push(request.url());
  });
  // Exercise the capability available on S3's plain-HTTP website endpoint.
  await page.addInitScript(() =>
    Object.defineProperty(crypto, "randomUUID", { value: undefined, configurable: true }),
  );
});
test.afterEach(async ({ page }) => expect(apiRequests.get(page)).toEqual([]));

for (const width of [1280, 390, 320]) {
  test(`static login, honest storage copy and source-derived notice at ${width}px`, async ({
    page,
    context,
  }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/#/auth/sign-in");
    await expect(page.getByText("Demo w przeglądarce.", { exact: true })).toBeVisible();
    await page.getByText("Konta demonstracyjne", { exact: true }).click();
    await expect(page.getByText("operator@doroboty.test", { exact: true })).toBeVisible();
    await page.getByLabel("Adres e-mail", { exact: true }).fill("candidate-anna@doroboty.test");
    await page.getByLabel("Hasło", { exact: true }).fill("wrong");
    await page.getByRole("button", { name: "Zaloguj się", exact: true }).click();
    await expect(page.getByRole("alert")).toContainText("Nieprawidłowy");
    await expect(page.getByLabel("Hasło", { exact: true })).toBeFocused();
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.screenshot({ path: `artifacts/s3-tests/login-${width}.png`, fullPage: true });
    const metric = (node: Element) => {
      const style = getComputedStyle(node);
      return {
        radius: style.borderRadius,
        font: style.fontFamily,
        size: style.fontSize,
        padding: style.padding,
        background: style.backgroundColor,
        border: style.borderColor,
      };
    };
    const host = await page.locator(".prototype-notice").first().evaluate(metric);
    const source = await context.newPage();
    await source.setViewportSize({ width, height: 900 });
    await source.goto("/reference/ui-host-profiles.html#feedback");
    expect(host).toEqual(
      await source.locator("#feedback .prototype-notice").first().evaluate(metric),
    );
    await source
      .locator("#feedback")
      .screenshot({ path: `artifacts/s3-tests/source-feedback-${width}.png` });
    await source.close();
    await page.getByLabel("Hasło", { exact: true }).fill("Test1234");
    await page.keyboard.press("Enter");
    await page.goto("/#/app/profil");
    await expect(page.getByLabel("Imię i nazwisko")).toHaveValue("Anna Kowalska");
    await page.goto("/#/app/settings");
    await expect(page.getByText(/Zmiany są zapisywane tylko w tej przeglądarce/)).toBeVisible();
    await page.screenshot({ path: `artifacts/s3-tests/settings-${width}.png`, fullPage: true });
    await page.goto("/#/polityka-prywatnosci");
    await expect(page.getByText(/Nie ma wspólnej bazy ani synchronizacji/)).toBeVisible();
    await page.screenshot({ path: `artifacts/s3-tests/privacy-${width}.png`, fullPage: true });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
    if (width === 1280)
      expect(
        (await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze())
          .violations,
      ).toEqual([]);
  });
}

test("file-only hosting supports publication, drafts, submission, CV snapshots and recruiter decisions after reload", async ({
  page,
  browser,
}) => {
  expect((await page.request.get("/api/state")).status()).toBe(404);
  await login(page, "employer-brightlabs");
  await page.goto("/#/app/oferty/nowa");
  await page.getByLabel("Nazwa stanowiska").fill("Static browser demo role");
  await page
    .getByLabel("Ogólny opis stanowiska", { exact: true })
    .fill("Szukamy osoby do badań z klientami, prototypowania i wdrażania automatyzacji obsługi.");
  await page.getByRole("button", { name: "Dalej: umiejętności i pytania →", exact: true }).click();
  await page.getByRole("button", { name: "Zrezygnuj z dodatkowych pytań", exact: true }).click();
  await page.getByRole("button", { name: "Przejdź do podglądu →", exact: true }).click();
  await page.getByRole("button", { name: "Opublikuj ofertę" }).click();
  await expect(
    page.getByRole("link", { name: "Static browser demo role", exact: true }),
  ).toBeVisible();
  await login(page, "candidate-anna");
  await page.goto("/#/oferty");
  await page.getByLabel("Szukaj ofert", { exact: true }).fill("Static browser demo role");
  await page.getByRole("button", { name: "Szukaj", exact: true }).click();
  await page.getByRole("link", { name: "Static browser demo role", exact: true }).click();
  await page.getByRole("link", { name: "Aplikuj", exact: true }).click();
  const answer =
    "Przeprowadziłam badania z użytkownikami i wdrożyłam automatyzację procesu obsługi.";
  await page.getByLabel("Dlaczego pasujesz do tej roli?").fill(answer);
  await page.getByRole("button", { name: "Zapisz szkic", exact: true }).click();
  await expect(page.getByText("Szkic został zapisany.", { exact: true })).toBeVisible();
  await page.reload();
  await expect(page.getByLabel("Dlaczego pasujesz do tej roli?")).toHaveValue(answer);
  await page.getByRole("checkbox").check();
  await page.getByRole("button", { name: "Wyślij aplikację", exact: true }).click();
  await page.getByRole("link", { name: "Static browser demo role", exact: true }).click();
  const id = page.url().split("/").pop();
  await page.getByRole("tab", { name: "CV", exact: true }).click();
  const href = await page.getByRole("link", { name: "Pobierz CV (PDF)" }).getAttribute("href");
  expect((await page.request.get(href!)).headers()["content-type"]).toContain("application/pdf");
  await login(page, "employer-brightlabs");
  await page.goto(`/#/app/kandydaci/${id}`);
  await page.getByRole("button", { name: "W przeglądzie", exact: true }).click();
  await page.reload();
  const saved = await page.evaluate((key) => JSON.parse(localStorage.getItem(key)!), key);
  expect(saved.applications.find((item: { id: string }) => item.id === id).stage).toBe("reviewed");
  const separate = await browser.newContext();
  const other = await separate.newPage();
  await other.goto("/#/auth/sign-in");
  expect(await other.evaluate((key) => localStorage.getItem(key), key)).toBe(null);
  await separate.close();
});

test("corrupt storage is downloadable and only confirmed reset overwrites it", async ({ page }) => {
  await page.addInitScript((key) => {
    if (!localStorage.getItem(key)) localStorage.setItem(key, "damaged original");
  }, key);
  await page.goto("/");
  await expect(page.getByText(/Dane nie zostaną nadpisane/)).toBeVisible();
  await login(page, "operator");
  await page.goto("/#/app/settings");
  const downloadEvent = page.waitForEvent("download");
  await page.getByRole("button", { name: "Pobierz poprzedni zapis", exact: true }).click();
  const download = await downloadEvent;
  expect(await readFile((await download.path())!, "utf8")).toBe("damaged original");
  await page.getByRole("button", { name: "Resetuj scenariusz", exact: true }).click();
  await page.getByRole("button", { name: "Anuluj", exact: true }).click();
  expect(await page.evaluate((key) => localStorage.getItem(key), key)).toBe("damaged original");
  await page.getByRole("button", { name: "Resetuj scenariusz", exact: true }).click();
  await page.getByRole("button", { name: "Resetuj", exact: true }).click();
  await expect(page.getByText("Przywrócono scenariusz początkowy.", { exact: true })).toBeVisible();
  expect(await page.evaluate((key) => JSON.parse(localStorage.getItem(key)!).version, key)).toBe(1);
});

test("failed browser writes preserve application input and allow retry", async ({ page }) => {
  await login(page, "candidate-anna");
  await page.goto("/#/aplikuj/ai-product-manager");
  const text = "Moja własna odpowiedź pozostaje w formularzu także po błędzie zapisu danych.";
  await page.getByLabel("Dlaczego pasujesz do tej roli?").fill(text);
  const original = await page.evaluateHandle(() => Storage.prototype.setItem);
  await page.evaluate(() => {
    Storage.prototype.setItem = () => {
      throw new Error("quota");
    };
  });
  await page.getByRole("button", { name: "Zapisz szkic", exact: true }).click();
  await expect(page.getByRole("alert")).toContainText("Nie udało się zapisać");
  await expect(page.getByLabel("Dlaczego pasujesz do tej roli?")).toHaveValue(text);
  await expect(page.getByText("Szkic został zapisany.", { exact: true })).toHaveCount(0);
  await page.evaluate((setItem) => {
    Storage.prototype.setItem = setItem;
  }, original);
  await page.getByRole("button", { name: "Zapisz szkic", exact: true }).click();
  await expect(page.getByText("Szkic został zapisany.", { exact: true })).toBeVisible();
});

test("operator JSON export/import preserves local long and missing data at all widths", async ({
  page,
}) => {
  await login(page, "operator");
  await page.goto("/#/app/settings");
  const downloaded = page.waitForEvent("download");
  await page.getByRole("button", { name: "Eksportuj dane", exact: true }).click();
  const file = await downloaded;
  const full = JSON.parse(await readFile((await file.path())!, "utf8"));
  const bio = "Własne przykładowe doświadczenie z projektowania automatyzacji. ".repeat(50);
  full.people[0].bio = bio.trim();
  full.people[0].name = "Anna o bardzo długim imieniu i nazwisku ".repeat(4).trim();
  delete full.jobs[0].salaryMin;
  delete full.jobs[0].salaryMax;
  await page.getByLabel("Importuj plik scenariusza").setInputFiles({
    name: "scenario.json",
    mimeType: "application/json",
    buffer: Buffer.from(JSON.stringify(full)),
  });
  await page.getByRole("button", { name: "Importuj", exact: true }).click();
  await expect(page.getByText("Dane zostały zaimportowane.", { exact: true })).toBeVisible();
  await login(page, "candidate-anna");
  for (const width of [1280, 390, 320]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/#/app/profil");
    await expect(page.getByLabel("O mnie", { exact: true })).toHaveValue(bio.trim());
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
    await page.screenshot({ path: `artifacts/s3-tests/long-profile-${width}.png`, fullPage: true });
  }
});
