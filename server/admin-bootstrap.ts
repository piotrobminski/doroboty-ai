import type { State } from "../src/features/prototype/model";

export const PRIMARY_ADMIN_ID = "primary-admin";
export const PRIMARY_ADMIN_EMAIL = "piotr.obminski@allegro.com";

export function primaryAdminProfile(): State["people"][number] {
  return {
    id: PRIMARY_ADMIN_ID,
    role: "operator",
    name: "Administrator",
    headline: "Administrator prototypu",
    location: "—",
    bio: "",
    cv: "",
    exampleScore: 0,
    exampleSummary: "",
  };
}

export function removeLegacyOperatorRoles(state: State) {
  for (const person of state.people)
    if (person.role === "operator" && person.id !== PRIMARY_ADMIN_ID) person.role = "candidate";
}
