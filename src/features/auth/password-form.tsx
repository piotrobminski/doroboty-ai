import { useRef, useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormSection } from "@/components/form-section";
import { usePrototype } from "../prototype/store";
import { Notice } from "../prototype/shell";
import { Field } from "../prototype/workspace";
import { changePasswordSchema } from "./contract";

export function PasswordForm() {
  const { changePassword, clearError, pending, state } = usePrototype();
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  const current = useRef<HTMLInputElement>(null);
  const next = useRef<HTMLInputElement>(null);
  const confirmation = useRef<HTMLInputElement>(null);
  const required = state.account?.mustChangePassword;

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;
    const form = event.currentTarget;
    clearError();
    setError("");
    setSaved(false);
    const parsed = changePasswordSchema.safeParse({
      currentPassword: current.current!.value,
      newPassword: next.current!.value,
    });
    if (!parsed.success) {
      setError(parsed.error.issues[0].message);
      (parsed.error.issues[0].path[0] === "currentPassword" ? current : next).current?.focus();
      return;
    }
    if (confirmation.current!.value !== parsed.data.newPassword) {
      setError("Nowe hasła muszą być takie same.");
      confirmation.current?.focus();
      return;
    }
    if (await changePassword(parsed.data)) {
      form.reset();
      setSaved(true);
    } else current.current?.focus();
  }

  return (
    <form
      className="prototype-panel prototype-form mb-6"
      onSubmit={submit}
      noValidate
      aria-busy={pending}
    >
      <FormSection
        index="01"
        eyebrow="Bezpieczeństwo"
        title="Zmień hasło"
        description={
          required
            ? "Ustaw własne hasło, aby odblokować konto."
            : "Po zmianie hasła pozostałe sesje zostaną zakończone."
        }
      >
        <Field label="Obecne hasło">
          <Input
            ref={current}
            type="password"
            autoComplete="current-password"
            required
            maxLength={128}
          />
        </Field>
        <Field label="Nowe hasło (min. 8 znaków)">
          <Input
            ref={next}
            type="password"
            autoComplete="new-password"
            required
            minLength={8}
            maxLength={128}
          />
        </Field>
        <Field label="Powtórz nowe hasło">
          <Input
            ref={confirmation}
            type="password"
            autoComplete="new-password"
            required
            maxLength={128}
          />
        </Field>
        {error && (
          <p role="alert" className="error-message">
            {error}
          </p>
        )}
      </FormSection>
      <Button type="submit" disabled={pending}>
        Zapisz nowe hasło
      </Button>
      {saved && <Notice tone="success">Hasło zostało zmienione.</Notice>}
    </form>
  );
}
