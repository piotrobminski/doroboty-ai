import { readFile, mkdir, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { chromium } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { format, resolveConfig } from "prettier";
import { initialState } from "../src/features/prototype/model.ts";

const root = new URL("../", import.meta.url);
const phase = process.argv[2] || "after";
if (!["before", "after"].includes(phase))
  throw new Error("Use before or after as the audit phase.");
const host = process.env.AUDIT_APP_URL || "http://127.0.0.1:3001";
const reference = process.env.AUDIT_REFERENCE_URL || "http://127.0.0.1:8952";
const manifestBytes = await readFile(
  new URL("docs/design-system/technologia-po-ludzku-manifest.json", root),
);
const manifest = JSON.parse(manifestBytes);
const referenceHash = createHash("sha256").update(manifestBytes).digest("hex");
if (phase === "after") {
  const beforePath = new URL("docs/design-system/audits/1.1/before/report.json", root);
  try {
    const before = JSON.parse(await readFile(beforePath, "utf8"));
    if (before.referenceManifestSha256 !== referenceHash)
      throw new Error(
        "Reference changed between audit phases; review the release instead of comparing different targets.",
      );
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
  }
}
const contract = JSON.parse(
  await readFile(
    new URL("docs/design-system/technologia-po-ludzku/agent-kit/host-profiles.json", root),
    "utf8",
  ),
);
if (manifest.version !== "1.1.0" || contract.version !== manifest.version)
  throw new Error("Audit requires the frozen 1.1.0 reference.");
const out = new URL(`docs/design-system/audits/1.1/${phase}/`, root);
await mkdir(out, { recursive: true });
const browser = await chromium.launch({
  executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH || undefined,
});
const context = await browser.newContext();
const page = await context.newPage();
const source = await context.newPage();
const checks = [],
  runtimeErrors = [],
  accessibility = [],
  sourceSamples = [];
page.on("pageerror", (error) => runtimeErrors.push(error.message));
const normalize = (value) =>
  String(value).replace(/\s+/g, " ").replace(/["']/g, "").trim().toLowerCase();
function check(id, width, role, expected, actual) {
  const pass =
    typeof expected === "number"
      ? Math.abs(Number(actual) - expected) < 0.06
      : normalize(actual) === normalize(expected);
  checks.push({ id, width, role, expected, actual, pass });
}
async function seed(person) {
  const state = initialState();
  state.activePersonId = person;
  await page.goto(`${host}/`);
  await page.evaluate(
    (state) => localStorage.setItem("doroboty.prototype.v1", JSON.stringify(state)),
    state,
  );
  await page.reload();
}
async function visit(route) {
  await page.goto(`${host}/#${route}`);
  await page.evaluate(() => document.fonts.ready);
  await page.mouse.move(0, 0);
}
async function style(locator, prop) {
  return locator
    .first()
    .evaluate((element, prop) => getComputedStyle(element).getPropertyValue(prop), prop);
}
async function screenshot(name, width) {
  await page.screenshot({ path: new URL(`${name}-${width}.png`, out).pathname, fullPage: true });
}
async function axe(name, width) {
  const result = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
    .analyze();
  accessibility.push({
    name,
    width,
    violations: result.violations.map(({ id, nodes }) => ({
      id,
      targets: nodes.map((node) => node.target),
    })),
  });
}
try {
  for (const width of [1280, 390, 320]) {
    await page.setViewportSize({ width, height: 900 });
    await source.setViewportSize({ width, height: 900 });
    await source.goto(`${reference}/`);
    await source.evaluate(() => document.fonts.ready);
    await source.mouse.move(0, 0);
    const base = {
      width,
      heroSize: parseFloat(await style(source.locator(".hero h1"), "font-size")),
      cardSize: parseFloat(await style(source.locator(".job-card h3"), "font-size")),
      cardRadius: parseFloat(await style(source.locator(".job-card"), "border-radius")),
    };
    sourceSamples.push(base);
    await source.screenshot({
      path: new URL(`source-listing-${width}.png`, out).pathname,
      fullPage: true,
    });
    await seed("candidate-anna");
    await visit("/oferty");
    check(
      "BASE",
      width,
      "discovery heading size",
      base.heroSize,
      parseFloat(await style(page.locator(".discovery-copy h1"), "font-size")),
    );
    check(
      "BASE",
      width,
      "card title size",
      base.cardSize,
      parseFloat(await style(page.locator(".tph-job-title"), "font-size")),
    );
    check(
      "BASE",
      width,
      "card radius",
      base.cardRadius,
      parseFloat(await style(page.locator(".tph-job-card"), "border-radius")),
    );
    check(
      "BASE",
      width,
      "card weight",
      contract.type.cardTitle.weight,
      Number(await style(page.locator(".tph-job-title"), "font-weight")),
    );
    check(
      "BASE",
      width,
      "sans type",
      contract.type.sans,
      await style(page.locator(".tph-job-title"), "font-family"),
    );
    check(
      "BASE",
      width,
      "default action",
      "rgb(23, 27, 25)",
      await style(page.locator(".tph-search-submit"), "background-color"),
    );
    check(
      "BASE",
      width,
      "page reflow",
      false,
      await page.evaluate(() => document.documentElement.scrollWidth > innerWidth),
    );
    const tokenValues = await page
      .locator(":root")
      .evaluate(
        (element, keys) =>
          Object.fromEntries(
            keys.map((key) => [key, getComputedStyle(element).getPropertyValue(key).trim()]),
          ),
        Object.keys(contract.tokens),
      );
    for (const [key, expected] of Object.entries(contract.tokens)) {
      if (key.startsWith("--tph-radius-") && !tokenValues[key]) continue; // Receiving aliases may differ; rendered role geometry is checked below.
      check("BASE", width, key, expected, tokenValues[key]);
    }
    const cards = await page.locator(".tph-job-card").evaluateAll((cards) =>
      cards.map((card) => {
        const id = card.getAttribute("aria-labelledby");
        const heading = id && document.getElementById(id);
        return Boolean(heading && heading.tagName === "H3" && card.contains(heading));
      }),
    );
    check("DS11-03", width, "job articles named by their own headings", true, cards.every(Boolean));
    for (const [area, label] of [
      ["build", "Build"],
      ["apply", "Apply"],
      ["lead", "Lead"],
    ]) {
      for (const prop of ["background-color", "color"])
        check(
          "BASE",
          width,
          `${label} C marker ${prop}`,
          await style(source.locator(`.area-marker.tone-area-${label}`), prop),
          await style(page.locator(`.area-marker[data-area=${area}]`), prop),
        );
    }
    await screenshot("listing", width);
    await axe("listing", width);
    await visit("/oferty?query=Product&remote=remote&seniority=senior");
    const chipNames = await page.locator(".tph-filter-chip").allTextContents();
    check(
      "DS11-02",
      width,
      "human-readable remote criterion",
      true,
      chipNames.some((name) => name.trim() === "Zdalnie"),
    );
    check(
      "DS11-02",
      width,
      "human-readable seniority criterion",
      true,
      chipNames.some((name) => name.trim() === "Senior"),
    );
    await screenshot("criteria", width);
    await visit("/app/profil");
    check(
      "HP02",
      width,
      "task title size",
      width <= 767 ? contract.type.taskTitle.max767 : contract.type.taskTitle.desktop,
      parseFloat(await style(page.locator(".page-heading h1"), "font-size")),
    );
    check(
      "HP02",
      width,
      "task title weight",
      contract.type.taskTitle.weight,
      Number(await style(page.locator(".page-heading h1"), "font-weight")),
    );
    check(
      "HP03",
      width,
      "field radius",
      contract.geometry.fieldRadius,
      parseFloat(await style(page.locator(".ui-input"), "border-radius")),
    );
    check(
      "HP03",
      width,
      "field size",
      width <= 600 ? 16 : 14,
      parseFloat(await style(page.locator(".ui-input"), "font-size")),
    );
    check(
      "HP03",
      width,
      "field min height",
      true,
      (await page.locator(".ui-input").first().boundingBox()).height >=
        contract.geometry.fieldMinHeight,
    );
    check(
      "HP03",
      width,
      "prefilled textarea accessible name",
      true,
      (await page.getByRole("textbox", { name: "O mnie", exact: true }).count()) === 1,
    );
    await screenshot("profile", width);
    await seed("employer-brightlabs");
    await visit("/app/oferty/nowa");
    const consent = page.getByRole("checkbox", {
      name: "Zatwierdzam treść oferty do publikacji.",
      exact: true,
    });
    const consentBox = await consent.evaluate((element) => {
      const r = element.closest("label").getBoundingClientRect();
      return { width: r.width, height: r.height };
    });
    check(
      "DS11-01",
      width,
      "checkbox label comfortable target",
      true,
      consentBox.height >= contract.geometry.comfortableTarget,
    );
    checks.at(-1).measurement = consentBox;
    check(
      "HP03",
      width,
      "form group title size",
      contract.type.formSectionTitle,
      parseFloat(await style(page.locator(".form-group-heading h2"), "font-size")),
    );
    check(
      "HP03",
      width,
      "select text inset",
      contract.geometry.selectRightPadding,
      parseFloat(await style(page.locator(".ui-select-trigger"), "padding-right")),
    );
    check(
      "HP03",
      width,
      "select chevron",
      contract.geometry.selectChevron,
      parseFloat(await style(page.locator(".ui-select-trigger > svg"), "width")),
    );
    check(
      "HP03",
      width,
      "select chevron inset",
      contract.geometry.selectChevronInset,
      parseFloat(await style(page.locator(".ui-select-trigger > svg"), "right")),
    );
    await screenshot("editor", width);
    await axe("employer editor", width);
    await seed("candidate-marek");
    await visit("/app/aplikacje/application-example");
    check(
      "HP02",
      width,
      "record title size",
      width <= 600
        ? contract.type.recordTitle.max600
        : width <= 1100
          ? contract.type.recordTitle.max1100
          : contract.type.recordTitle.desktop,
      parseFloat(await style(page.locator(".recruiting-header h1"), "font-size")),
    );
    check(
      "HP04",
      width,
      "record reading title",
      contract.type.recordReadingTitle,
      parseFloat(await style(page.locator(".record-reading h3"), "font-size")),
    );
    check(
      "HP04",
      width,
      "record text",
      contract.type.bodyReading.size,
      parseFloat(await style(page.locator(".record-reading p"), "font-size")),
    );
    check(
      "HP04",
      width,
      "record line height",
      contract.type.bodyReading.size * contract.type.bodyReading.lineHeight,
      parseFloat(await style(page.locator(".record-reading p"), "line-height")),
    );
    check(
      "HP05",
      width,
      "recorded current step",
      true,
      (await page.locator(".process-timeline li[aria-current=step]").count()) === 1,
    );
    check(
      "HP05",
      width,
      "mobile material order",
      true,
      width > 950 ||
        (await page.locator(".record-sheet").boundingBox()).y <
          (await page.locator(".recruiting-margin").boundingBox()).y,
    );
    await screenshot("record", width);
    await axe("candidate record", width);
    await source.goto(`${reference}/ui-host-profiles.html`);
    await source.screenshot({
      path: new URL(`source-profiles-${width}.png`, out).pathname,
      fullPage: true,
    });
    await seed(null);
    await visit("/oferty/ai-product-manager");
    check(
      "BASE",
      width,
      "contextual action",
      "rgb(194, 249, 112)",
      await style(page.locator(".tph-offer-actions > a"), "background-color"),
    );
    if (width <= 850) {
      await page.getByRole("button", { name: "Otwórz nawigację", exact: true }).click();
      check(
        "HP01",
        width,
        "modal radius",
        width <= 600 ? contract.geometry.modalRadiusMax600 : contract.geometry.modalRadius,
        parseFloat(await style(page.locator('[data-slot="dialog-content"]'), "border-radius")),
      );
      await page.keyboard.press("Escape");
    }
  }
} finally {
  await browser.close();
}
const failures = checks.filter((check) => !check.pass);
const findings = [...new Set(failures.map((item) => item.id))].map((id) => ({
  id,
  instances: failures.filter((item) => item.id === id),
}));
const report = {
  date: "2026-11-13",
  phase,
  referenceVersion: manifest.version,
  referenceManifestSha256: referenceHash,
  families: contract.families,
  profileCount: contract.profiles.length,
  widths: [1280, 390, 320],
  checks,
  sourceSamples,
  findings,
  accessibility,
  runtimeErrors,
};
const reportPath = new URL("report.json", out);
await writeFile(
  reportPath,
  await format(JSON.stringify(report), {
    ...(await resolveConfig(reportPath.pathname)),
    parser: "json",
  }),
);
console.log(
  JSON.stringify({
    phase,
    checks: checks.length,
    failedMeasurements: failures.length,
    findings: findings.map((f) => f.id),
    axeViolations: accessibility.flatMap((result) => result.violations).length,
    runtimeErrors,
  }),
);
if (
  phase === "after" &&
  (findings.length ||
    runtimeErrors.length ||
    accessibility.some((result) => result.violations.length))
)
  process.exitCode = 1;
