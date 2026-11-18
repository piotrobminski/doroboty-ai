import { afterEach, expect, it, vi } from "vitest";
import { uuid } from "./uuid";
afterEach(() => vi.unstubAllGlobals());
it("creates UUIDs when HTTP hosting lacks crypto.randomUUID", () => {
  const getRandomValues = crypto.getRandomValues.bind(crypto);
  vi.stubGlobal("crypto", { getRandomValues });
  const first = uuid();
  expect(first).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
  expect(uuid()).not.toBe(first);
});
