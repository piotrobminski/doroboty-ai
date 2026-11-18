import { test as base, expect, type Page, request, type APIRequestContext } from "@playwright/test";
import { initialState, type State } from "../../src/features/prototype/model";
import { accountEmail, API_HEADER } from "../../src/features/auth/contract";
import {
  FIXTURE_ADMIN_PASSWORD,
  FIXTURE_TEMPORARY_PASSWORD,
  PRIMARY_ADMIN_EMAIL,
  PRIMARY_ADMIN_ID,
  serverInitialState,
} from "../admin-fixture";

export { expect };
export const TEST_ORIGIN = `http://127.0.0.1:${Number(process.env.PROTOTYPE_TEST_PORT || "3106")}`;
const admins = new WeakMap<Page, APIRequestContext>();
export async function signIn(page: Page, personId: string) {
  const response = await page.request.post("/api/auth/login", {
    headers: API_HEADER,
    data:
      personId === PRIMARY_ADMIN_ID
        ? { email: PRIMARY_ADMIN_EMAIL, password: FIXTURE_ADMIN_PASSWORD }
        : { email: accountEmail(personId), password: "Test1234" },
  });
  expect(response.ok(), await response.text()).toBe(true);
}
export async function seedScenario(page: Page, state: State) {
  const admin = admins.get(page)!;
  const stored = (await (await admin.get("/api/scenario/export")).json()) as State;
  const ids = new Set(state.people.map((person) => person.id));
  const people = [...state.people, ...stored.people.filter((person) => !ids.has(person.id))];
  const response = await admin.post("/api/scenario/import", {
    headers: API_HEADER,
    data: { ...state, people },
  });
  expect(response.ok(), await response.text()).toBe(true);
  if (state.activePersonId) await signIn(page, state.activePersonId);
  else await page.request.post("/api/auth/logout", { headers: API_HEADER, data: {} });
}
export async function scenario(page: Page): Promise<State> {
  await page.waitForFunction(() => document.body.dataset.saving !== "true");
  const current = await (await page.request.get("/api/state")).json();
  const full = await (await admins.get(page)!.get("/api/scenario/export")).json();
  return { ...full, activePersonId: current.activePersonId };
}
export async function chooseAccount(page: Page, name: string) {
  const person = serverInitialState().people.find((p) => p.name === name)!;
  if (!page.url().includes("/#/auth/")) await page.goto("/#/auth/sign-in");
  await page
    .getByLabel("Adres e-mail", { exact: true })
    .fill(person.id === PRIMARY_ADMIN_ID ? PRIMARY_ADMIN_EMAIL : accountEmail(person.id));
  await page
    .getByLabel("Hasło", { exact: true })
    .fill(person.id === PRIMARY_ADMIN_ID ? FIXTURE_ADMIN_PASSWORD : "Test1234");
  await page.getByRole("button", { name: "Zaloguj się", exact: true }).click();
  await expect(page).not.toHaveURL(/#\/auth\//);
}
export const test = base.extend({
  page: async ({ page }, providePage) => {
    const admin = await request.newContext({ baseURL: TEST_ORIGIN });
    const login = (password: string) =>
      admin.post("/api/auth/login", {
        headers: API_HEADER,
        data: { email: PRIMARY_ADMIN_EMAIL, password },
      });
    if (!(await login(FIXTURE_ADMIN_PASSWORD)).ok()) {
      expect((await login(FIXTURE_TEMPORARY_PASSWORD)).ok()).toBe(true);
      expect(
        (
          await admin.post("/api/auth/change-password", {
            headers: API_HEADER,
            data: {
              currentPassword: FIXTURE_TEMPORARY_PASSWORD,
              newPassword: FIXTURE_ADMIN_PASSWORD,
            },
          })
        ).ok(),
      ).toBe(true);
    }
    admins.set(page, admin);
    try {
      await seedScenario(page, initialState());
      await providePage(page);
    } finally {
      await admin.dispose();
    }
  },
});
