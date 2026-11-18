import { serverInitialState } from "../admin-fixture";
import { test, expect, chooseAccount, signIn } from "./fixtures";
import { initialState } from "../../src/features/prototype/model";
import { API_HEADER, accountEmail } from "../../src/features/auth/contract";
import AxeBuilder from "@axe-core/playwright";

for (const width of [1280, 390, 320]) {
  test(`login validation, keyboard, responsive layout and logout at ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/#/auth/sign-in?next=/app/profil");
    await page.getByRole("button", { name: "Zaloguj się", exact: true }).click();
    await expect(page.getByLabel("Adres e-mail", { exact: true })).toBeFocused();
    await page
      .getByLabel("Adres e-mail", { exact: true })
      .fill("bardzo-dlugi-adres-konta-z-niepoprawnymi-danymi@doroboty.test");
    await page.getByLabel("Hasło", { exact: true }).fill("wrong");
    await page.getByRole("button", { name: "Zaloguj się", exact: true }).click();
    await expect(page.getByRole("alert")).toContainText("Nieprawidłowy e-mail lub hasło");
    await expect(page.getByLabel("Hasło", { exact: true })).toBeFocused();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
    await page.screenshot({ path: `artifacts/auth/login-error-${width}.png`, fullPage: true });
    if (width === 1280)
      expect(
        (await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze())
          .violations,
      ).toEqual([]);
    await page.getByLabel("Adres e-mail", { exact: true }).fill(accountEmail("candidate-anna"));
    await page.getByLabel("Hasło", { exact: true }).fill("Test1234");
    await page.keyboard.press("Enter");
    await expect(page.getByLabel("Imię i nazwisko")).toHaveValue("Anna Kowalska");
    await page.reload();
    await expect(page.getByLabel("Imię i nazwisko")).toHaveValue("Anna Kowalska");
    const cookies = await page.context().cookies();
    expect(cookies.find((c) => c.name === "doroboty_session")).toMatchObject({
      httpOnly: true,
      sameSite: "Strict",
    });
    if (width !== 1280)
      await page.getByRole("button", { name: "Otwórz menu", exact: true }).click();
    await page.getByRole("button", { name: "Wyloguj się", exact: true }).click();
    await expect(page.getByRole("heading", { name: "Zaloguj się", exact: true })).toBeVisible();
    await page.reload();
    await expect(page.getByLabel("Hasło", { exact: true })).toBeVisible();
    const response = await page.request.get("/api/state");
    expect((await response.json()).activePersonId).toBe(null);
  });
}

test("existing accounts retain their identities and only the primary account starts as administrator", async ({
  page,
}) => {
  for (const person of serverInitialState().people) {
    await chooseAccount(page, person.name);
    const state = await (await page.request.get("/api/state")).json();
    expect(state.activePersonId).toBe(person.id);
    expect(state.people.find((p: { id: string }) => p.id === person.id)).toMatchObject(person);
  }
});

test("failed persistence and session expiry keep application input for retry", async ({
  page,
  context,
}) => {
  await chooseAccount(page, "Anna Kowalska");
  await page.goto("/#/aplikuj/ai-product-manager");
  const answer =
    "Przeprowadziłam badania użytkowników i wdrożyłam usprawnienia procesu obsługi zgłoszeń.";
  await page.getByLabel("Dlaczego pasujesz do tej roli?").fill(answer);
  await context.setOffline(true);
  await page.getByRole("button", { name: "Zapisz szkic", exact: true }).click();
  await expect(page.getByRole("alert")).toContainText("Nie można połączyć");
  await expect(page.getByLabel("Dlaczego pasujesz do tej roli?")).toHaveValue(answer);
  await context.setOffline(false);
  await page.getByRole("button", { name: "Zapisz szkic", exact: true }).click();
  await expect(page.getByRole("status")).toHaveText("Szkic został zapisany.");
  await context.clearCookies();
  await page.getByRole("button", { name: "Zapisz szkic", exact: true }).click();
  await expect(page.getByRole("alert")).toContainText("Sesja wygasła");
  await expect(page.getByLabel("Dlaczego pasujesz do tej roli?")).toHaveValue(answer);
  await signIn(page, "candidate-anna");
  await page.getByRole("button", { name: "Zapisz szkic", exact: true }).click();
  await page.reload();
  await expect(page.getByLabel("Dlaczego pasujesz do tej roli?")).toHaveValue(answer);
});

test("browser identity spoofing and candidate scenario replacement are rejected", async ({
  page,
}) => {
  await page.goto("/");
  await page.evaluate(() =>
    localStorage.setItem("doroboty.prototype.v1", JSON.stringify({ activePersonId: "operator" })),
  );
  await page.goto("/#/app/case");
  await page.reload();
  await expect(page.getByRole("heading", { name: "Zaloguj się", exact: true })).toBeVisible();
  await chooseAccount(page, "Anna Kowalska");
  expect(
    (
      await page.request.post("/api/actions", {
        headers: API_HEADER,
        data: { type: "select_person", id: "operator" },
      })
    ).status(),
  ).toBe(400);
  expect(
    (await page.request.post("/api/scenario/reset", { headers: API_HEADER, data: {} })).status(),
  ).toBe(403);
  const state = await (await page.request.get("/api/state")).json();
  expect(state.applications).toEqual([]);
  expect(state.people.some((p: { id: string }) => p.id === "candidate-marek")).toBe(false);
});

test("initial connection failure exposes a keyboard-accessible retry", async ({ page }) => {
  await page.route("**/api/state", (route) => route.abort());
  await page.goto("/#/auth/sign-in");
  await expect(page.getByRole("status")).toContainText("Nie można połączyć");
  await page.unroute("**/api/state");
  await page.getByRole("button", { name: "Spróbuj ponownie", exact: true }).focus();
  await page.keyboard.press("Enter");
  await expect(page.getByLabel("Adres e-mail", { exact: true })).toBeVisible();
});

test("operator migrates a browser save only after confirmation and preserves the original", async ({
  page,
}) => {
  const legacy = initialState();
  legacy.people[0].bio = "Zachowany profil z poprzedniego zapisu przeglądarki.";
  const raw = JSON.stringify(legacy);
  await page.goto("/");
  await page.evaluate((raw) => localStorage.setItem("doroboty.prototype.v1", raw), raw);
  await page.reload();
  await chooseAccount(page, "Administrator");
  await page.goto("/#/app/settings");
  await page
    .getByRole("button", { name: "Przenieś poprzedni zapis z przeglądarki", exact: true })
    .click();
  await page.getByRole("button", { name: "Anuluj", exact: true }).click();
  let saved = await (await page.request.get("/api/state")).json();
  expect(saved.people[0].bio).not.toBe(legacy.people[0].bio);
  await page
    .getByRole("button", { name: "Przenieś poprzedni zapis z przeglądarki", exact: true })
    .click();
  await page.getByRole("button", { name: "Importuj", exact: true }).click();
  await expect(page.getByRole("status")).toHaveText("Dane zostały zaimportowane.");
  saved = await (await page.request.get("/api/state")).json();
  const expected = serverInitialState();
  expected.people[0].bio = legacy.people[0].bio;
  expect(saved.people).toEqual(expected.people);
  expect(await page.evaluate(() => localStorage.getItem("doroboty.prototype.v1"))).toBe(raw);
  await chooseAccount(page, "Anna Kowalska");
  await page.goto("/#/app/profil");
  await expect(page.getByLabel("O mnie", { exact: true })).toHaveValue(legacy.people[0].bio);
});
