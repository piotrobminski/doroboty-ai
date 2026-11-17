import { chromium } from "@playwright/test";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

// Record actual UI operations in a new context. Never import into or reset the user's browser.
const root = fileURLToPath(new URL("../", import.meta.url));
const origin = process.env.PR02_DEMO_ORIGIN ?? "http://127.0.0.1:3001";
if (!/^http:\/\/127\.0\.0\.1:\d+$/u.test(origin)) throw new Error("Use a loopback demo origin.");
const output = path.join(root, "artifacts/pr02-demo");
await mkdir(output, { recursive: true });
const browser = await chromium.launch({
  executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH || undefined,
});
const context = await browser.newContext({
  viewport: { width: 1440, height: 900 },
  recordVideo: { dir: path.join(output, "raw"), size: { width: 1440, height: 900 } },
  reducedMotion: "reduce",
});
await context.addInitScript(() => {
  document.addEventListener("DOMContentLoaded", () => {
    const style = document.createElement("style");
    style.textContent =
      "body{padding-bottom:82px!important}button,a,input,textarea,summary{scroll-margin-block:100px}#demo-caption{position:fixed;z-index:2147483647;inset:auto 0 0;display:flex;align-items:center;gap:24px;min-height:66px;padding:14px 28px;background:#171B19;color:#FFFEF9;font:16px/1.45 Arial,Helvetica,sans-serif;pointer-events:none;border-top:3px solid #7B2CBF}#demo-caption small{flex-shrink:0;color:#C2F970;font:12px/1.5 monospace;letter-spacing:.06em}#demo-caption strong{font-weight:500}";
    document.head.append(style);
    const caption = document.createElement("div");
    caption.id = "demo-caption";
    caption.innerHTML = "<small></small><strong></strong>";
    document.body.append(caption);
  });
});
const page = await context.newPage();
page.setDefaultTimeout(15000);
const started = Date.now();
const chapters = [];
const apiRequests = [];
const errors = [];
page.on("request", (request) => {
  if (
    request.url().includes("/api/") ||
    request.url().includes("api.openai.com") ||
    request.url().includes("example.com")
  )
    apiRequests.push(request.url());
});
page.on("pageerror", (error) => errors.push(error.message));
const pause = (ms = 1200) => page.waitForTimeout(ms);
async function caption(role, text) {
  chapters.push({ seconds: Math.round((Date.now() - started) / 100) / 10, role, text });
  await page.locator("#demo-caption").waitFor();
  await page.evaluate(
    ({ role, text }) => {
      document.querySelector("#demo-caption small").textContent = role;
      document.querySelector("#demo-caption strong").textContent = text;
    },
    { role, text },
  );
}
async function click(locator) {
  await locator.scrollIntoViewIfNeeded();
  await pause(350);
  await locator.click();
  await pause(700);
}
async function type(locator, text, delay = 14) {
  await locator.scrollIntoViewIfNeeded();
  await locator.click();
  await locator.pressSequentially(text, { delay });
  await pause(700);
}
async function select(label, value) {
  await click(page.getByRole("combobox", { name: label, exact: true }));
  await click(page.getByRole("option", { name: value, exact: true }));
}
async function person(name) {
  await click(page.getByRole("button", { name: `Wejdź jako ${name}`, exact: true }));
}
const title = "Specjalista ds. usprawniania obsługi klienta";
const description =
  "Szukamy osoby, która uporządkuje obsługę zgłoszeń i pomoże skrócić czas odpowiedzi. Będziesz wdrażać usprawnienia z wykorzystaniem nowych narzędzi, w tym AI, oraz sprawdzać jakość odpowiedzi. Ważna jest współpraca z zespołem operacyjnym i wyjaśnianie wprowadzanych zmian.";
const examples = [
  "Samodzielnie opracowałam nowy proces obsługi zgłoszeń klientów. Wdrożyłam podział zgłoszeń na kategorie. Czas odpowiedzi skrócił się z 12 do 8 godzin.",
  "Brałam udział w rozmowach o jakości odpowiedzi. Zespół zajmował się testami, ale nie potrafię jeszcze wskazać moich własnych działań ani sposobu pomiaru efektu.",
  "Przygotowałam plan współpracy z zespołem operacyjnym. Osobiście przeprowadziłam warsztat i zebrałam uwagi. Efektem było przyjęcie nowej procedury przez 4 osoby.",
];
try {
  await page.goto(`${origin}/#/auth/sign-in`);
  await caption("01 / REKRUTER", "Karolina tworzy ofertę i opisuje pracę, którą trzeba wykonać.");
  await person("Karolina Wiśniewska");
  await click(page.getByRole("link", { name: "Dodaj ofertę", exact: true }));
  await type(page.getByLabel("Nazwa stanowiska", { exact: true }), title, 25);
  await type(page.getByLabel("Ogólny opis stanowiska", { exact: true }), description, 15);
  await select("Kategoria", "Apply");
  await select("Funkcja", "Operations");
  await type(page.locator('[name="salaryMin"]'), "14000", 70);
  await type(page.locator('[name="salaryMax"]'), "19000", 70);
  await caption(
    "02 / PYTANIA O WKŁAD",
    "Z opisu powstają proponowane umiejętności i pytania. Rekruter może je poprawić.",
  );
  await click(page.getByRole("button", { name: "Dalej: umiejętności i pytania →", exact: true }));
  await page.locator(".job-skill-nav").scrollIntoViewIfNeeded();
  await pause(2200);
  await page.getByLabel("Pytanie o własny wkład 1", { exact: true }).scrollIntoViewIfNeeded();
  await pause(2200);
  await click(page.getByRole("button", { name: "Następna umiejętność →", exact: true }));
  await pause(1800);
  await click(page.getByRole("button", { name: "Następna umiejętność →", exact: true }));
  await pause(1800);
  await caption(
    "03 / PUBLIKACJA",
    "Przejście do podglądu potwierdza sprawdzenie pytań. Jeden przycisk publikuje ofertę.",
  );
  await click(page.getByRole("button", { name: "Przejdź do podglądu →", exact: true }));
  await page.locator(".job-preview").scrollIntoViewIfNeeded();
  await pause(1800);
  await page.locator(".job-preview-question").first().scrollIntoViewIfNeeded();
  await pause(1800);
  await click(page.getByRole("button", { name: "Opublikuj ofertę", exact: true }));
  await page.getByRole("heading", { name: "Moje oferty", exact: true }).waitFor();
  await pause(1200);
  await caption("04 / KANDYDAT", "Anna otwiera ofertę i dodaje własne przykłady oraz materiały.");
  await click(page.getByRole("link", { name: "Formularz karty PR02", exact: true }));
  await person("Anna Kowalska");
  await page.getByRole("heading", { name: "Aplikuj na ofertę", exact: true }).waitFor();
  await pause(1200);
  for (let index = 0; index < examples.length; index++) {
    await type(
      page.getByLabel(`Twój przykład i własny wkład ${index + 1}`, { exact: true }),
      examples[index],
      16,
    );
    if (!index)
      await type(
        page.getByLabel("Materiały 1 (opcjonalnie)", { exact: true }),
        "https://example.com/syntetyczny-proces-obslugi",
        15,
      );
  }
  await click(page.getByRole("checkbox"));
  await click(page.getByRole("button", { name: "Wyślij aplikację", exact: true }));
  await page.getByRole("heading", { name: "Moje aplikacje", exact: true }).waitFor();
  await pause(1500);
  await caption(
    "05 / REKRUTER",
    "Karolina wraca do Kandydatów i otwiera przesłaną aplikację Anny.",
  );
  await click(page.getByRole("link", { name: "Zmień osobę", exact: true }));
  await person("Karolina Wiśniewska");
  await click(page.getByRole("link", { name: "Kandydaci", exact: true }));
  await click(page.getByRole("link", { name: "Anna Kowalska", exact: true }));
  const panel = page.getByRole("region", {
    name: "Zgodność odpowiedzi z wymaganiami",
    exact: true,
  });
  await panel.waitFor();
  if (!(await panel.textContent()).includes("2 z 3 odpowiedzi"))
    throw new Error("Unexpected demo evidence summary");
  await caption(
    "06 / PODPOWIEDŹ AI",
    "Dwa konkretne przykłady i jedna odpowiedź do doprecyzowania. Ocena ma oparcie w cytatach.",
  );
  await panel.locator("header").scrollIntoViewIfNeeded();
  await pause(2800);
  await click(panel.locator("summary").first());
  await panel.locator("li").first().scrollIntoViewIfNeeded();
  await pause(2500);
  await panel.locator("li").nth(1).scrollIntoViewIfNeeded();
  await pause(3000);
  await caption(
    "07 / WŁASNA DECYZJA",
    "Wymagania, odpowiedzi i materiały pozostają obok siebie. Rekruter sam zapisuje uzasadnienie.",
  );
  await page.locator(".competency-comparison").first().scrollIntoViewIfNeeded();
  await pause(3000);
  await page.getByLabel("Uzasadnienie następnego kroku", { exact: true }).scrollIntoViewIfNeeded();
  await pause(1700);
  await caption(
    "PODSUMOWANIE",
    "Opis stanowiska → pytania o wkład → aplikacja → podpowiedź zgodności z wymaganiami.",
  );
  await panel.locator("header").scrollIntoViewIfNeeded();
  await pause(3500);
  if (apiRequests.length || errors.length)
    throw new Error(`Demo check failed: ${JSON.stringify({ apiRequests, errors })}`);
  const scenario = await page.evaluate(() => localStorage.getItem("doroboty.prototype.v1"));
  await writeFile(path.join(output, "scenario.json"), scenario);
  await page.screenshot({ path: path.join(output, "final-frame.png") });
  const durationSeconds = Math.round((Date.now() - started) / 100) / 10;
  const video = page.video();
  await context.close();
  await video.saveAs(path.join(output, "pr02-workflow.webm"));
  await video.delete();
  await writeFile(
    path.join(output, "chapters.json"),
    JSON.stringify(
      { durationSeconds, viewport: { width: 1440, height: 900 }, chapters, apiRequests, errors },
      null,
      2,
    ),
  );
  console.log(
    JSON.stringify({
      video: path.join(output, "pr02-workflow.webm"),
      durationSeconds,
      chapters: chapters.length,
      apiRequests: apiRequests.length,
      errors: errors.length,
    }),
  );
} finally {
  await browser.close();
}
