import { createServer } from "node:http";
import type { AddressInfo } from "node:net";
import { describe, expect, it, vi } from "vitest";
import { AI_ENDPOINT } from "../src/features/prototype/ai-contract";
import { createRecruiterAiMiddleware } from "./recruiter-ai";

const input = {
  kind: "description",
  title: "Projektant automatyzacji AI",
  source:
    "Projektujesz automatyzację obsługi syntetycznych zgłoszeń i sprawdzasz jakość odpowiedzi.",
};
const description =
  "Projektujesz proces obsługi zgłoszeń z AI i porównujesz jakość odpowiedzi na syntetycznym zestawie testowym.";
function envelope(result: unknown) {
  return {
    status: "completed",
    model: "gpt-5-mini-test",
    output: [
      { type: "reasoning" },
      { content: [{ type: "output_text", text: JSON.stringify(result) }] },
    ],
  };
}
async function gateway(
  fetcher: typeof fetch,
  check: (origin: string) => Promise<void>,
  key: string | undefined = "test-key",
) {
  const middleware = createRecruiterAiMiddleware({ apiKey: key }, fetcher);
  const server = createServer((req, res) => {
    void middleware(req, res, () => {
      res.writeHead(404);
      res.end();
    });
  });
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  const origin = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
  try {
    await check(origin);
  } finally {
    server.closeAllConnections();
    await new Promise<void>((resolve) => server.close(() => resolve()));
  }
}
function post(origin: string, body: unknown = input, headers: Record<string, string> = {}) {
  return fetch(origin + AI_ENDPOINT, {
    method: "POST",
    headers: { Origin: origin, "Content-Type": "application/json", ...headers },
    body: JSON.stringify(body),
  });
}

describe("local OpenAI gateway", () => {
  it("validates, calls Responses once and returns only a validated proposal and model", async () => {
    const upstream = vi.fn<typeof fetch>(async (_url, init) => {
      const request = JSON.parse(String(init?.body));
      expect(request.store).toBe(false);
      expect(request.text.format).toMatchObject({ type: "json_schema", strict: true });
      expect(request.max_output_tokens).toBe(3500);
      expect(init?.headers).toMatchObject({ Authorization: "Bearer test-key" });
      return Response.json(
        envelope(
          request.text.format.name === "job_description"
            ? { description }
            : {
                criteria: [
                  {
                    requirement: "Weryfikacja jakości odpowiedzi modelu",
                    question: "Opisz własne decyzje, pracę zespołu i sposób sprawdzenia wyniku.",
                  },
                ],
              },
        ),
      );
    });
    await gateway(upstream, async (origin) => {
      const response = await post(origin);
      expect(await response.json()).toEqual({
        kind: "description",
        description,
        model: "gpt-5-mini-test",
      });
      const criteria = await (await post(origin, { kind: "criteria", description })).json();
      expect(criteria.criteria[0].id).toMatch(/^[a-z0-9-]+$/);
      expect(criteria.criteria[0].requirement).toContain("Weryfikacja");
      expect(upstream.mock.calls[0][0]).toBe("https://api.openai.com/v1/responses");
      expect(JSON.parse(String(upstream.mock.calls[0][1]?.body)).input).toBe(JSON.stringify(input));
      expect(upstream).toHaveBeenCalledTimes(2);
    });
  });
  it("reports missing configuration without making a provider request", async () => {
    const upstream = vi.fn<typeof fetch>();
    await gateway(
      upstream,
      async (origin) => {
        expect(await (await fetch(origin + AI_ENDPOINT)).json()).toEqual({
          configured: false,
          model: "gpt-5-mini",
        });
        const response = await post(origin);
        expect(response.status).toBe(503);
        expect(await response.json()).toEqual({ error: "not_configured" });
        expect(upstream).not.toHaveBeenCalled();
      },
      "",
    );
  });
  it("rejects foreign/missing origins, unsupported methods/types and invalid or oversized payloads before spending", async () => {
    const upstream = vi.fn<typeof fetch>();
    await gateway(upstream, async (origin) => {
      expect((await post(origin, input, { Origin: "https://foreign.example" })).status).toBe(403);
      expect(
        (await post(origin, input, { Origin: origin.replace("http:", "https:") })).status,
      ).toBe(403);
      expect((await fetch(origin + AI_ENDPOINT, { method: "POST", body: "{}" })).status).toBe(403);
      expect((await post(origin, input, { "Content-Type": "text/plain" })).status).toBe(415);
      expect((await post(origin, { ...input, candidateCv: "Must not be sent" })).status).toBe(400);
      expect((await post(origin, { ...input, source: "short" })).status).toBe(400);
      expect((await post(origin, { ...input, source: "x".repeat(70000) })).status).toBe(413);
      expect(
        (await fetch(origin + AI_ENDPOINT, { method: "DELETE", headers: { Origin: origin } }))
          .status,
      ).toBe(405);
      expect(upstream).not.toHaveBeenCalled();
    });
  });
  for (const [status, payload, error] of [
    [401, { error: { message: "secret upstream details test-key" } }, "credentials"],
    [429, { error: { message: "secret upstream details test-key" } }, "rate_limit"],
    [
      429,
      { error: { code: "insufficient_quota", message: "secret upstream details test-key" } },
      "quota",
    ],
    [
      429,
      { error: { code: "credit_balance_exhausted", message: "private billing details" } },
      "credits",
    ],
    [
      429,
      { error: { code: "project_spend_limit_exceeded", message: "private project details" } },
      "quota",
    ],
    [
      429,
      {
        error: {
          code: "organization_usage_limit_exceeded",
          message: "private organization details",
        },
      },
      "quota",
    ],
    [500, { error: { message: "secret upstream details test-key" } }, "provider"],
    [200, { ...envelope({ description }), status: "incomplete" }, "invalid_output"],
    [
      200,
      {
        ...envelope({}),
        output: [{ content: [{ type: "refusal", refusal: "private refusal content" }] }],
      },
      "refused",
    ],
    [200, envelope({ description: "short" }), "invalid_output"],
    [
      200,
      { ...envelope({}), output: [{ content: [{ type: "output_text", text: "not json" }] }] },
      "invalid_output",
    ],
  ] as const) {
    it(`redacts upstream errors and handles ${status}/${error}`, async () => {
      const upstream = vi.fn<typeof fetch>(async () => Response.json(payload, { status }));
      await gateway(upstream, async (origin) => {
        const response = await post(origin);
        expect(response.ok).toBe(false);
        expect(await response.json()).toEqual({ error });
        expect(upstream).toHaveBeenCalledTimes(1);
      });
    });
  }
  it("caps concurrent requests and cancels upstream work when the browser disconnects", async () => {
    const upstream = vi.fn<typeof fetch>(
      (_url, init) =>
        new Promise((_resolve, reject) => {
          init?.signal?.addEventListener("abort", () =>
            reject(new DOMException("Aborted", "AbortError")),
          );
        }),
    );
    await gateway(upstream, async (origin) => {
      const first = new AbortController();
      const second = new AbortController();
      const call = (controller: AbortController) =>
        fetch(origin + AI_ENDPOINT, {
          method: "POST",
          headers: { Origin: origin, "Content-Type": "application/json" },
          body: JSON.stringify(input),
          signal: controller.signal,
        }).catch(() => null);
      const pending = [call(first), call(second)];
      await vi.waitFor(() => expect(upstream).toHaveBeenCalledTimes(2));
      expect((await post(origin)).status).toBe(429);
      first.abort();
      second.abort();
      await Promise.all(pending);
      await vi.waitFor(() =>
        expect(upstream.mock.calls.every((call) => call[1]?.signal?.aborted)).toBe(true),
      );
    });
  });
  it("limits a local session to ten provider calls per minute", async () => {
    const upstream = vi.fn<typeof fetch>(async () => Response.json(envelope({ description })));
    await gateway(upstream, async (origin) => {
      for (let index = 0; index < 10; index++) expect((await post(origin)).status).toBe(200);
      expect((await post(origin)).status).toBe(429);
      expect(upstream).toHaveBeenCalledTimes(10);
    });
  });
});
