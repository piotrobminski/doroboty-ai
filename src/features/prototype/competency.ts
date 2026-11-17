import { z } from "zod";

const identifier = z
  .string()
  .min(1)
  .max(100)
  .regex(/^[a-zA-Z0-9][a-zA-Z0-9_-]*$/);
export const decisionReasonSchema = z.string().trim().min(20).max(12000);
export const criterionSchema = z.object({
  id: identifier,
  requirement: z.string().trim().min(10).max(1000),
  question: z.string().trim().min(10).max(1000),
  sourceExcerpt: z.string().trim().min(1).max(1000).optional(),
  explanation: z.string().trim().min(1).max(1000).optional(),
});
export const criteriaSchema = z
  .array(criterionSchema)
  .min(1)
  .max(6)
  .refine(
    (items) => new Set(items.map((item) => item.id)).size === items.length,
    "Duplicate criterion identifiers",
  );
export const competencyCardSchema = z
  .object({
    sourceDescription: z.string().trim().min(30).max(12000),
    proposedCriteria: criteriaSchema,
    criteria: criteriaSchema,
    approvedBy: identifier,
    approvedAt: z.iso.datetime(),
    mode: z.enum(["local-template", "openai"]),
    model: z.string().trim().min(1).max(100).optional(),
  })
  .refine(
    (card) => card.mode !== "openai" || !!card.model,
    "OpenAI cards require model provenance",
  );
export const draftResponsesSchema = z
  .array(
    z.object({
      criterionId: identifier,
      example: z.string().trim().max(12000),
      materials: z.string().trim().max(2000),
    }),
  )
  .max(100)
  .refine(
    (items) => new Set(items.map((item) => item.criterionId)).size === items.length,
    "Duplicate response identifiers",
  );
export const competencySubmissionSchema = z
  .object({
    card: competencyCardSchema,
    responses: draftResponsesSchema,
  })
  .superRefine(({ card, responses }, ctx) => {
    if (
      responses.length !== card.criteria.length ||
      card.criteria.some(
        (criterion) =>
          !responses.some(
            (response) => response.criterionId === criterion.id && response.example.length >= 20,
          ),
      )
    )
      ctx.addIssue({
        code: "custom",
        message: "Każde kryterium wymaga przykładu własnego wkładu (minimum 20 znaków).",
      });
  });
export type Criterion = z.infer<typeof criterionSchema>;
export type CompetencyCard = z.infer<typeof competencyCardSchema>;
export type CompetencyResponse = z.infer<typeof draftResponsesSchema>[number];

/** Offline scenario helper. Source excerpts are prompts for human review, never assessments. */
export function proposeCriteria(description: string): Criterion[] {
  const source = z.string().trim().min(30).max(12000).parse(description);
  const fragments = source
    .split(/\n+|(?<=[.!?])\s+/u)
    .map((line) => line.replace(/^\s*[-*•\d.)]+\s*/, "").trim())
    .filter((line) => line.length >= 20);
  const tasks = fragments.filter((line) =>
    /projekt|tworz|budow|wdra|analiz|automat|bada|odpowiad|zarządz|współprac|rozwija|test|ocen|przygotow|dostarcz|prowadz/iu.test(
      line,
    ),
  );
  return (tasks.length ? tasks : fragments.length ? fragments : [source])
    .slice(0, 3)
    .map((task) => ({
      id: crypto.randomUUID(),
      requirement: task.slice(0, 800),
      question: `Opisz przykład związany z zadaniem: „${task.slice(0, 350)}”. Co zrobiłeś/zrobiłaś osobiście, jakie decyzje podjąłeś/podjęłaś, jak użyłeś/użyłaś AI i jak sprawdziłeś/sprawdziłaś wynik? Oddziel swój wkład od pracy zespołu.`,
    }));
}
