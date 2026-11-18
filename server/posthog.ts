import { randomUUID } from "node:crypto";
import type { ServerAction } from "../src/features/prototype/model";

export function postHogEvent(action: ServerAction) {
  switch (action.type) {
    case "publish":
      return action.job.publicationStatus === "published" ? "job publication saved" : undefined;
    case "submit":
      return "application submitted";
    case "stage":
      return "application stage recorded";
    case "close_recruitment":
      return "recruitment closed";
  }
}

type PrototypeEvent = NonNullable<ReturnType<typeof postHogEvent>>;
export type PostHogCapture = (event: PrototypeEvent) => void;

export function postHogFromEnv(
  env: Record<string, string | undefined>,
): PostHogCapture | undefined {
  const projectToken = env.POSTHOG_PROJECT_TOKEN?.trim();
  const region = env.POSTHOG_REGION?.trim() || "eu";
  if (!projectToken || !/^phc_[A-Za-z0-9_-]+$/.test(projectToken)) return;
  if (region !== "eu" && region !== "us") return;

  const endpoint = `https://${region}.i.posthog.com/i/v0/e/`;
  let pending = 0;
  return (event) => {
    if (pending >= 8) return;
    pending++;
    void fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      redirect: "error",
      signal: AbortSignal.timeout(3_000),
      body: JSON.stringify({
        api_key: projectToken,
        distinct_id: randomUUID(),
        event,
        properties: {
          source: "doroboty-aiph3",
          $process_person_profile: false,
          $geoip_disable: true,
        },
      }),
    })
      .then((response) => response.body?.cancel())
      .catch(() => {})
      .finally(() => {
        pending--;
      });
  };
}
