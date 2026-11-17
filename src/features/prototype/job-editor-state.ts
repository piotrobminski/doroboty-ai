import { z } from "zod";
import { criterionSchema, criteriaSchema } from "./competency";

export const cardDraftSchema = z
  .object({
    sourceDescription: z.string().max(12000),
    proposedCriteria: criteriaSchema,
    criteria: z
      .array(
        criterionSchema.extend({
          requirement: z.string().max(1000),
          question: z.string().max(1000),
        }),
      )
      .min(1)
      .max(6)
      .refine((items) => new Set(items.map((item) => item.id)).size === items.length),
    excludedIds: z.array(z.string().max(100)).max(6),
    mode: z.enum(["local-template", "openai"]),
    model: z.string().max(100).optional(),
    approved: z.boolean(),
  })
  .refine(
    (card) =>
      new Set(card.excludedIds).size === card.excludedIds.length &&
      card.excludedIds.every((id) => card.criteria.some((item) => item.id === id)) &&
      (card.mode !== "openai" || !!card.model?.trim()),
  );
export type CardDraft = z.infer<typeof cardDraftSchema>;
export const jobEditorDraftSchema = z
  .object({
    title: z.string().max(200),
    summary: z.string().max(12000),
    description: z.string().max(12000),
    category: z.enum(["build", "apply", "lead"]),
    function: z.enum(["product", "engineering", "data", "design", "marketing", "operations"]),
    remoteStatus: z.enum(["onsite", "hybrid", "remote"]),
    seniority: z.enum(["junior", "mid", "senior", "lead"]),
    contract: z.enum(["employment", "b2b", "mandate"]),
    locations: z.string().max(2000),
    salaryMin: z.string().max(30),
    salaryMax: z.string().max(30),
    card: cardDraftSchema.nullable(),
    step: z.union([z.literal(1), z.literal(2), z.literal(3)]),
  })
  .refine(
    (draft) => draft.step === 1 || draft.card !== null,
    "Question and preview steps require a card draft",
  );
export type JobEditorDraft = z.infer<typeof jobEditorDraftSchema>;
