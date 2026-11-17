import { test, expect, type Page } from "@playwright/test";
import { type State } from "../../src/features/prototype/model";
import { STORAGE_KEY } from "../../src/features/prototype/storage";

export { test, expect };
export const TEST_ORIGIN = `http://127.0.0.1:${Number(process.env.PROTOTYPE_TEST_PORT || "3106")}`;
export async function seedScenario(page: Page, state: State) {
  await page.goto("/");
  await page.evaluate(({ key, state }) => localStorage.setItem(key, JSON.stringify(state)), {
    key: STORAGE_KEY,
    state,
  });
  await page.reload();
}
export async function scenario(page: Page): Promise<State> {
  return page.evaluate((key) => JSON.parse(localStorage.getItem(key) || "null"), STORAGE_KEY);
}
export async function choosePerson(page: Page, name: string) {
  if (!page.url().includes("/#/auth/")) await page.goto("/#/auth/sign-in");
  await page.getByRole("button", { name: `Wejdź jako ${name}`, exact: true }).click();
}
