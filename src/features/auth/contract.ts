import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email("Podaj poprawny adres e-mail.").max(254),
  password: z.string().min(1, "Podaj hasło.").max(128, "Hasło jest za długie."),
});
export const accountEmail = (personId: string) => `${personId}@doroboty.test`;
export const API_HEADER = { "Content-Type": "application/json", "X-Requested-With": "DoRoboty" };
