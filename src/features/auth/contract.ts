import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email("Podaj poprawny adres e-mail.").max(254),
  password: z.string().min(1, "Podaj hasło.").max(128, "Hasło jest za długie."),
});
export const accountEmail = (personId: string) => `${personId}@doroboty.test`;
export const API_HEADER = { "Content-Type": "application/json", "X-Requested-With": "DoRoboty" };

const password = z.string().min(8, "Podaj co najmniej 8 znaków.").max(128, "Hasło jest za długie.");
export const requestRecoverySchema = z.object({ email: loginSchema.shape.email }).strict();
export const passwordResetSchema = z
  .object({
    token: z.string().regex(/^[a-f0-9]{64}$/),
    newPassword: password,
  })
  .strict();
export type RecoveryMode = "off" | "local" | "email";
export const changePasswordSchema = z
  .object({
    currentPassword: loginSchema.shape.password,
    newPassword: password,
  })
  .strict();
const accountId = z.string().min(1).max(100);
export const accountCommandSchema = z.discriminatedUnion("type", [
  z
    .object({
      type: z.literal("create"),
      email: loginSchema.shape.email,
      name: z.string().trim().min(1, "Podaj nazwę konta.").max(200),
      role: z.enum(["candidate", "employer"]),
      companyId: accountId.optional(),
      password,
    })
    .strict(),
  z.object({ type: z.literal("reset-password"), id: accountId, password }).strict(),
  z.object({ type: z.literal("set-admin"), id: accountId, admin: z.boolean() }).strict(),
]);
export type AccountCommand = z.infer<typeof accountCommandSchema>;
export type AccountAccess = { admin: boolean; mustChangePassword: boolean };
export type AccountSummary = {
  id: string;
  name: string;
  email: string;
  role: "candidate" | "employer" | "operator";
  companyId?: string;
  admin: boolean;
  primary: boolean;
};
