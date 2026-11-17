import { useRef, useState, type FormEvent } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormSection } from "@/components/form-section";
import { PageTitle } from "../prototype/shell";
import { usePrototype } from "../prototype/store";
import { currentPerson } from "../prototype/model";
import { loginSchema } from "./contract";

export function LoginPage() {
  const { state, login, logout, error, clearError, pending } = usePrototype();
  const navigate = useNavigate();
  const location = useLocation();
  const [params] = useSearchParams();
  const [invalid, setInvalid] = useState("");
  const email = useRef<HTMLInputElement>(null);
  const password = useRef<HTMLInputElement>(null);
  const person = currentPerson(state);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;
    clearError();
    const values = { email: email.current!.value, password: password.current!.value };
    const parsed = loginSchema.safeParse(values);
    if (!parsed.success) {
      const field = parsed.error.issues[0].path[0];
      setInvalid(
        field === "email"
          ? "Podaj poprawny adres e-mail."
          : "Podaj hasło (maksymalnie 128 znaków).",
      );
      (field === "email" ? email : password).current?.focus();
      return;
    }
    setInvalid("");
    const loggedIn = await login(values.email, values.password);
    if (loggedIn) {
      const role = currentPerson(loggedIn)?.role;
      const home = role === "employer" ? "/app/oferty" : role === "operator" ? "/app/case" : "/app";
      const next =
        params.get("next") ??
        (!location.pathname.startsWith("/auth") ? location.pathname + location.search : home);
      navigate(
        /^\/(?!\/)/.test(next) && !next.startsWith("/auth") && !next.includes("\\") ? next : home,
      );
    } else password.current?.focus();
  }
  return (
    <section className="prototype-section login-page">
      <PageTitle
        eyebrow="DoRoboty.ai / Konto"
        description="Zaloguj się, aby wrócić do swoich ofert, profilu i aplikacji."
      >
        Zaloguj się
      </PageTitle>
      {person && (
        <p className="mb-6">
          Zalogowano jako {person.name}. Możesz zalogować się na inne konto lub{" "}
          <Button
            variant="outline"
            disabled={pending}
            onClick={async () => {
              if (await logout()) clearError();
            }}
          >
            wylogować się
          </Button>
          .
        </p>
      )}
      <form
        className="prototype-panel prototype-form"
        noValidate
        onSubmit={submit}
        aria-busy={pending}
      >
        <FormSection index="01" title="Twoje konto">
          <div className="field">
            <label htmlFor="login-email">Adres e-mail</label>
            <Input
              ref={email}
              id="login-email"
              name="email"
              type="email"
              autoComplete="username"
              required
              maxLength={254}
              aria-invalid={invalid.startsWith("Podaj poprawny") || undefined}
              aria-describedby={invalid ? "login-error" : undefined}
            />
          </div>
          <div className="field">
            <label htmlFor="login-password">Hasło</label>
            <Input
              ref={password}
              id="login-password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              maxLength={128}
              aria-invalid={!!error || invalid.startsWith("Podaj hasło") || undefined}
              aria-describedby={invalid || error ? "login-error" : undefined}
            />
          </div>
          {(invalid || error) && (
            <p id="login-error" className="error-message" role="alert">
              {invalid || error}
            </p>
          )}
        </FormSection>
        <Button type="submit" disabled={pending}>
          {pending ? "Logowanie…" : "Zaloguj się"}
        </Button>
      </form>
      <p className="mt-6 text-muted-foreground">
        Prototyp szkoleniowy. Korzystaj wyłącznie z przygotowanych kont i danych przykładowych.
      </p>
    </section>
  );
}
