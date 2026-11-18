import { readdir, readFile, rm } from "node:fs/promises";
import { join } from "node:path";
import { expect, test, TEST_ORIGIN } from "./fixtures";

test("signed-out user requests and redeems a private recovery link", async ({ page }) => {
  const email = "candidate-anna@doroboty.test";
  const inbox = join(".data/password-reset-mail", new URL(TEST_ORIGIN).port);
  const list = () =>
    readdir(inbox).catch((error: NodeJS.ErrnoException) => {
      if (error.code === "ENOENT") return [];
      throw error;
    });
  const previous = new Set(await list());
  let message: { file: string; path: string; link: string } | undefined;
  try {
    await page.goto("/#/auth/sign-in");
    await page.getByRole("link", { name: "Nie pamiętasz hasła?" }).press("Enter");
    const input = page.getByLabel("Adres e-mail", { exact: true });
    await page.getByRole("button", { name: "Wyślij link do resetu" }).click();
    await expect(input).toBeFocused();
    await expect(input).toHaveAttribute("aria-invalid", "true");
    await expect(page.getByRole("alert")).toHaveText("Podaj poprawny adres e-mail.");
    await input.fill(`${"a".repeat(60)}@${"b".repeat(60)}.example.test`);
    for (const width of [1280, 390, 320]) {
      await page.setViewportSize({ width, height: 900 });
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
        true,
      );
      await page
        .locator("main")
        .screenshot({ path: `artifacts/password-recovery/request-${width}.png` });
    }
    await input.fill(email);
    await input.press("Enter");
    await expect(page.getByRole("status")).toContainText("prywatnej skrzynce testowej");
    await expect
      .poll(async () => {
        for (const file of await list()) {
          if (previous.has(file) || !file.endsWith(".json")) continue;
          const path = join(inbox, file);
          const item = JSON.parse(await readFile(path, "utf8"));
          if (item.email !== email) continue;
          message = { file, path, link: item.link };
          return true;
        }
        return false;
      })
      .toBe(true);
    expect((await page.request.get(`/${inbox}/${message!.file}`)).status()).toBe(403);

    await page.goto("/#/auth/reset-password");
    await expect(page.getByText("Brakuje ważnego linku do resetu.")).toBeVisible();
    await page.goto(message!.link);
    await expect(page).toHaveURL(/#\/auth\/reset-password$/);
    const next = page.getByLabel("Nowe hasło (min. 8 znaków)", { exact: true });
    const confirm = page.getByLabel("Powtórz nowe hasło", { exact: true });
    await next.fill("Recovery-Password-24");
    await confirm.fill("Mismatch");
    await confirm.press("Enter");
    await expect(page.getByRole("alert")).toHaveText("Nowe hasła muszą być takie same.");
    await expect(confirm).toBeFocused();
    await expect(confirm).toHaveAttribute("aria-invalid", "true");
    for (const width of [1280, 390, 320]) {
      await page.setViewportSize({ width, height: 900 });
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
        true,
      );
      await page
        .locator("main")
        .screenshot({ path: `artifacts/password-recovery/reset-${width}.png` });
    }
    await confirm.fill("Recovery-Password-24");
    await confirm.press("Enter");
    await expect(page.getByRole("status")).toContainText("Zaloguj się nowym hasłem");
    await page.getByLabel("Adres e-mail", { exact: true }).fill(email);
    await page.getByLabel("Hasło", { exact: true }).fill("Recovery-Password-24");
    await page.getByRole("button", { name: "Zaloguj się", exact: true }).click();
    await expect(page).toHaveURL(/#\/app$/);
  } finally {
    if (message) await rm(message.path, { force: true });
  }
});
