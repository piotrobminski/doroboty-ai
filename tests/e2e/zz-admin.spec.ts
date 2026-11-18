import { randomUUID } from "node:crypto";
import { test, expect, chooseAccount } from "./fixtures";

test("administrator manages accounts and users rotate their temporary password", async ({
  page,
  browser,
}) => {
  await chooseAccount(page, "Prowadzący");
  await page.goto("/#/app/admin");
  await expect(page.getByRole("heading", { name: "Brak dostępu administracyjnego" })).toBeVisible();
  await chooseAccount(page, "Administrator");
  await page.goto("/#/app/admin");
  const email = `konto-demonstracyjne-${randomUUID()}@example.test`;
  await page
    .getByLabel("Nazwa użytkownika")
    .fill("Przykładowe konto administracyjne z bardzo długą nazwą użytkownika");
  await page.getByLabel("Adres e-mail").fill(email);
  await page
    .getByLabel("Hasło tymczasowe (min. 8 znaków)", { exact: true })
    .fill("Browser-Temporary-24");
  await page.getByRole("button", { name: "Dodaj konto", exact: true }).click();
  const card = page.getByRole("listitem").filter({ hasText: email });
  await expect(card).toBeVisible();
  for (const width of [1280, 390, 320]) {
    await page.setViewportSize({ width, height: 900 });
    await card.getByText("Zarządzaj kontem", { exact: true }).focus();
    if ((await card.locator("details").getAttribute("open")) === null) {
      await page.keyboard.press("Enter");
    }
    await expect(card.getByLabel("Nowe hasło tymczasowe")).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
    await page.screenshot({ path: `artifacts/account-admin/account-${width}.png` });
  }
  await card.getByRole("button", { name: "Nadaj dostęp administracyjny" }).click();
  await expect(card.getByText(/Dostęp administracyjny/)).toBeVisible();
  const context = await browser.newContext();
  try {
    const account = await context.newPage();
    await account.goto(new URL("/#/auth/sign-in", page.url()).href);
    await account.getByLabel("Adres e-mail").fill(email);
    await account.getByLabel("Hasło", { exact: true }).fill("Browser-Temporary-24");
    await account.getByRole("button", { name: "Zaloguj się", exact: true }).click();
    await expect(account).toHaveURL(/#\/app\/settings$/);
    await account.goto(new URL("/#/app/admin", page.url()).href);
    await expect(account).toHaveURL(/#\/app\/settings$/);
    await account.getByLabel("Obecne hasło", { exact: true }).fill("Browser-Temporary-24");
    await account
      .getByLabel("Nowe hasło (min. 8 znaków)", { exact: true })
      .fill("Browser-Private-24");
    const confirmation = account.getByLabel("Powtórz nowe hasło", { exact: true });
    await confirmation.fill("Other-Password-24");
    await account.getByRole("button", { name: "Zapisz nowe hasło" }).click();
    await expect(account.getByRole("alert")).toHaveText("Nowe hasła muszą być takie same.");
    await expect(confirmation).toBeFocused();
    await confirmation.fill("Browser-Private-24");
    await confirmation.press("Enter");
    await expect(account.getByText("Hasło zostało zmienione.", { exact: true })).toBeVisible();
    await account.goto(new URL("/#/app/admin", page.url()).href);
    await expect(account.getByRole("heading", { name: "Panel administracyjny" })).toBeVisible();
    await card.getByRole("button", { name: "Odbierz dostęp administracyjny" }).click();
    await expect(card.getByRole("button", { name: "Nadaj dostęp administracyjny" })).toBeVisible();
    await account.reload();
    await expect(account.getByRole("heading", { name: "Zaloguj się" })).toBeVisible();
    await card.getByLabel("Nowe hasło tymczasowe").fill("Browser-Reset-24");
    await card.getByRole("button", { name: "Ustaw hasło tymczasowe" }).click();
    await expect(card.getByText(/Ustawiono hasło tymczasowe/)).toBeVisible();
  } finally {
    await context.close();
  }
});
