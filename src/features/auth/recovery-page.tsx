import { useEffect, useRef, useState, type FormEvent } from "react";
import { Link, useNavigate, useSearchParams } from "react-router";
import { BackLink } from "@/components/back-link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormSection } from "@/components/form-section";
import { Notice, PageTitle } from "../prototype/shell";
import { requestJson, usePrototype } from "../prototype/store";
import { passwordResetSchema, requestRecoverySchema } from "./contract";

export function PasswordRecoveryPage({ reset = false }: { reset?: boolean }) {
  const { recoveryMode, refresh } = usePrototype();
  const [params, setParams] = useSearchParams();
  const [token, setToken] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<{ message: string; field?: "first" | "confirmation" }>();
  const first = useRef<HTMLInputElement>(null);
  const confirmation = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  useEffect(() => {
    const linkToken = reset ? params.get("token") : null;
    if (linkToken === null) return;
    setToken(linkToken);
    setError(undefined);
    setParams({}, { replace: true });
  }, [params, reset, setParams]);
  const tokenValid = /^[a-f0-9]{64}$/.test(token);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    const value = first.current?.value ?? "";
    const parsed = reset
      ? passwordResetSchema.safeParse({ token, newPassword: value })
      : requestRecoverySchema.safeParse({ email: value });
    setError(undefined);
    if (!parsed.success) {
      setError({ message: parsed.error.issues[0].message, field: "first" });
      first.current?.focus();
      return;
    }
    if (reset && confirmation.current?.value !== value) {
      setError({ message: "Nowe hasła muszą być takie same.", field: "confirmation" });
      confirmation.current?.focus();
      return;
    }
    setBusy(true);
    try {
      await requestJson(
        reset ? "/api/auth/reset-password" : "/api/auth/forgot-password",
        parsed.data,
      );
      if (reset) {
        await refresh();
        navigate("/auth/sign-in", { replace: true, state: { passwordRecovered: true } });
      } else setSent(true);
    } catch (error) {
      setError({ message: (error as Error).message });
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="prototype-section login-page">
      <BackLink to="/auth/sign-in">Wróć do logowania</BackLink>
      <PageTitle
        eyebrow="DoRoboty.ai / Konto"
        description={
          reset
            ? "Wybierz nowe hasło do konta."
            : "Podaj adres używany do logowania. Link resetujący jest ważny przez 30 minut."
        }
      >
        {reset ? "Ustaw nowe hasło" : "Odzyskaj hasło"}
      </PageTitle>
      {recoveryMode === "off" ? (
        <Notice tone="warning">
          Odzyskiwanie hasła jest niedostępne. Skontaktuj się z administratorem.
        </Notice>
      ) : reset && !tokenValid ? (
        <Notice tone="warning">
          Brakuje ważnego linku do resetu.{" "}
          <Link to="/auth/forgot-password" className="underline">
            Poproś o nowy link
          </Link>
        </Notice>
      ) : sent ? (
        <Notice tone="success">
          {recoveryMode === "local"
            ? "Jeśli konto istnieje, link będzie dostępny w prywatnej skrzynce testowej serwera."
            : "Jeśli konto istnieje, wyślemy link na podany adres. Sprawdź również folder spam."}
        </Notice>
      ) : (
        <form
          key={token}
          className="prototype-panel prototype-form"
          onSubmit={submit}
          noValidate
          aria-busy={busy}
        >
          <FormSection title={reset ? "Nowe dane logowania" : "Adres konta"}>
            <div className="field">
              <label htmlFor="recovery-input">
                {reset ? "Nowe hasło (min. 8 znaków)" : "Adres e-mail"}
              </label>
              <Input
                id="recovery-input"
                ref={first}
                name={reset ? "new-password" : "email"}
                type={reset ? "password" : "email"}
                autoComplete={reset ? "new-password" : "email"}
                maxLength={reset ? 128 : 254}
                aria-invalid={error?.field === "first" || undefined}
                aria-describedby={error?.field === "first" ? "recovery-error" : undefined}
                required
              />
            </div>
            {reset && (
              <div className="field">
                <label htmlFor="recovery-confirmation">Powtórz nowe hasło</label>
                <Input
                  id="recovery-confirmation"
                  ref={confirmation}
                  name="confirm-password"
                  type="password"
                  autoComplete="new-password"
                  maxLength={128}
                  aria-invalid={error?.field === "confirmation" || undefined}
                  aria-describedby={error?.field === "confirmation" ? "recovery-error" : undefined}
                  required
                />
              </div>
            )}
            {error && (
              <p className="error-message" role="alert" id="recovery-error">
                {error.message}
              </p>
            )}
          </FormSection>
          <Button type="submit" disabled={busy}>
            {reset
              ? busy
                ? "Zapisywanie…"
                : "Zapisz nowe hasło"
              : busy
                ? "Wysyłanie…"
                : "Wyślij link do resetu"}
          </Button>
          {reset && error && (
            <Link className="underline" to="/auth/forgot-password">
              Poproś o nowy link
            </Link>
          )}
        </form>
      )}
    </section>
  );
}
