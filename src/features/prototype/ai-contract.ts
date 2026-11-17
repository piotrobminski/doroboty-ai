import { z } from "zod";
import { criteriaSchema } from "./competency";

export const AI_ENDPOINT = "/api/recruiter-ai";
export const AI_TIMEOUT_MS = 60_000;
export const aiRequestSchema = z.discriminatedUnion("kind", [
  z.strictObject({
    kind: z.literal("description"),
    title: z.string().trim().min(3).max(200),
    source: z.string().trim().min(20).max(12000),
  }),
  z.strictObject({
    kind: z.literal("criteria"),
    description: z.string().trim().min(30).max(12000),
  }),
]);
export const descriptionOutputSchema = z.strictObject({
  description: z.string().trim().min(30).max(12000),
});
export const criteriaOutputSchema = z.strictObject({
  criteria: z
    .array(
      z.strictObject({
        requirement: z.string().trim().min(10).max(1000),
        question: z.string().trim().min(10).max(1000),
      }),
    )
    .min(1)
    .max(6),
});
export const aiResponseSchema = z.discriminatedUnion("kind", [
  descriptionOutputSchema.extend({
    kind: z.literal("description"),
    model: z.string().min(1).max(100),
  }),
  z.strictObject({
    kind: z.literal("criteria"),
    criteria: criteriaSchema,
    model: z.string().min(1).max(100),
  }),
]);
export const aiErrors = {
  input: "Sprawdź wymagane dane. Podaj nazwę stanowiska i brief albo opis oferty.",
  unavailable:
    "Asystent AI jest niedostępny. Możesz edytować ofertę ręcznie lub spróbować ponownie w lokalnej wersji z integracją OpenAI.",
  not_configured:
    "Brakuje konfiguracji OpenAI na lokalnym serwerze. Uzupełnij ją i uruchom serwer ponownie. Możesz też edytować ofertę ręcznie.",
  credentials:
    "OpenAI odrzuciło dostęp. Sprawdź klucz i uprawnienia do modelu w konfiguracji lokalnego serwera.",
  rate_limit:
    "Osiągnięto limit zapytań lub środków OpenAI. Spróbuj później albo sprawdź limity konta. Twoja treść pozostaje w formularzu.",
  quota:
    "OpenAI zgłasza brak dostępnego limitu rozliczeniowego. Sprawdź środki i limit wydatków projektu na koncie OpenAI, a następnie spróbuj ponownie. Twoja treść pozostaje w formularzu.",
  credits:
    "OpenAI zgłasza brak środków na koncie API. Sprawdź rozliczenia organizacji i uzupełnij środki, a następnie spróbuj ponownie. Twoja treść pozostaje w formularzu.",
  timeout: "Generowanie trwało zbyt długo. Spróbuj ponownie. Twoja treść pozostaje w formularzu.",
  refused:
    "OpenAI nie przygotowało tej propozycji. Sprawdź syntetyczny opis roli i spróbuj ponownie lub uzupełnij treść ręcznie.",
  invalid_output:
    "Propozycja AI jest niekompletna lub ma nieprawidłowy format. Spróbuj ponownie albo uzupełnij treść ręcznie.",
  provider:
    "Nie udało się połączyć z OpenAI. Spróbuj ponownie. Twoja dotychczasowa treść pozostaje bez zmian.",
} as const;
export type AiErrorCode = keyof typeof aiErrors;
export type AiRequest = z.infer<typeof aiRequestSchema>;
export type AiResponse = z.infer<typeof aiResponseSchema>;
