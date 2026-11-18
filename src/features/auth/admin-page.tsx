import { useEffect, useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormSelect } from "@/components/ui/form-select";
import { FormSection } from "@/components/form-section";
import { Field } from "../prototype/workspace";
import { Notice, PageTitle } from "../prototype/shell";
import { requestJson, usePrototype } from "../prototype/store";
import { accountCommandSchema, type AccountCommand, type AccountSummary } from "./contract";

const endpoint = "/api/admin/accounts";
const roles = [
  { value: "candidate", label: "Kandydat" },
  { value: "employer", label: "Pracodawca" },
];

export function AdminPage() {
  const { state } = usePrototype();
  const [accounts, setAccounts] = useState<AccountSummary[]>([]);
  const [role, setRole] = useState("candidate");
  const [pending, setPending] = useState(false);
  const [ready, setReady] = useState(false);
  const [feedback, setFeedback] = useState<{ place: string; message: string; error?: boolean }>();

  async function load() {
    try {
      setAccounts((await requestJson(endpoint)) as AccountSummary[]);
      setReady(true);
      setFeedback(undefined);
    } catch (error) {
      setFeedback({ place: "load", message: (error as Error).message, error: true });
    }
  }
  useEffect(() => {
    void load();
  }, []);

  async function execute(place: string, input: unknown, success: string) {
    if (pending) return false;
    const command = accountCommandSchema.safeParse(input);
    if (!command.success) {
      setFeedback({ place, message: command.error.issues[0].message, error: true });
      return false;
    }
    setPending(true);
    setFeedback(undefined);
    try {
      setAccounts((await requestJson(endpoint, command.data)) as AccountSummary[]);
      setFeedback({ place, message: success });
      return true;
    } catch (error) {
      setFeedback({ place, message: (error as Error).message, error: true });
      return false;
    } finally {
      setPending(false);
    }
  }

  function result(place: string) {
    if (feedback?.place !== place) return null;
    return feedback.error ? (
      <p role="alert" className="error-message">
        {feedback.message}
      </p>
    ) : (
      <Notice tone="success">{feedback.message}</Notice>
    );
  }

  async function create(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const values = new FormData(form);
    if (
      await execute(
        "create",
        {
          type: "create",
          name: values.get("name"),
          email: values.get("email"),
          password: values.get("password"),
          role,
          companyId: values.get("companyId") || undefined,
        },
        "Konto zostało dodane. Użytkownik zmieni hasło przy pierwszym logowaniu.",
      )
    ) {
      form.reset();
      setRole("candidate");
    }
  }

  async function reset(event: FormEvent<HTMLFormElement>, id: string) {
    event.preventDefault();
    const form = event.currentTarget;
    if (
      await execute(
        id,
        { type: "reset-password", id, password: new FormData(form).get("password") },
        "Ustawiono hasło tymczasowe i zakończono sesje konta.",
      )
    )
      form.reset();
  }

  return (
    <>
      <PageTitle
        eyebrow="DoRoboty.ai / Administracja"
        description="Dodawaj konta, ustawiaj hasła tymczasowe i nadawaj dostęp do administracji."
      >
        Panel administracyjny
      </PageTitle>
      {result("load")}
      {!ready && feedback?.place === "load" && (
        <Button onClick={() => void load()}>Spróbuj ponownie</Button>
      )}
      {!ready && !feedback && <Notice>Ładowanie kont…</Notice>}
      {ready && (
        <>
          <form
            className="prototype-panel prototype-form mb-6"
            onSubmit={create}
            aria-busy={pending}
          >
            <FormSection index="01" eyebrow="Konta" title="Dodaj konto">
              <Field label="Nazwa użytkownika">
                <Input name="name" required maxLength={200} />
              </Field>
              <Field label="Adres e-mail">
                <Input name="email" type="email" required maxLength={254} />
              </Field>
              <Field label="Rola w rekrutacji">
                <FormSelect options={roles} value={role} onValueChange={setRole} />
              </Field>
              {role === "employer" && (
                <Field label="Firma">
                  <FormSelect
                    name="companyId"
                    required
                    options={state.companies.map((company) => ({
                      value: company.id,
                      label: company.name,
                    }))}
                  />
                </Field>
              )}
              <Field label="Hasło tymczasowe (min. 8 znaków)">
                <Input
                  name="password"
                  type="password"
                  autoComplete="new-password"
                  required
                  minLength={8}
                  maxLength={128}
                />
              </Field>
            </FormSection>
            <Button type="submit" disabled={pending}>
              Dodaj konto
            </Button>
            {result("create")}
          </form>
          <section className="prototype-panel prototype-form" aria-labelledby="managed-accounts">
            <h2 id="managed-accounts">Istniejące konta</h2>
            <ul className="divide-y divide-border">
              {accounts.map((account) => {
                const editable = !account.primary && account.id !== state.activePersonId;
                const access: AccountCommand = {
                  type: "set-admin",
                  id: account.id,
                  admin: !account.admin,
                };
                return (
                  <li key={account.id} className="min-w-0 py-4">
                    <strong className="block wrap-anywhere">{account.name}</strong>
                    <p className="wrap-anywhere">{account.email}</p>
                    <p className="text-sm text-muted-foreground">
                      {account.primary
                        ? "Główny administrator"
                        : roles.find((item) => item.value === account.role)?.label}
                      {account.admin && !account.primary ? " · Dostęp administracyjny" : ""}
                    </p>
                    {editable && (
                      <details>
                        <summary className="min-h-11 cursor-pointer py-3">Zarządzaj kontem</summary>
                        <div className="prototype-form">
                          <Button
                            type="button"
                            variant="outline"
                            className="max-w-full whitespace-normal"
                            disabled={pending}
                            onClick={() =>
                              void execute(
                                account.id,
                                access,
                                "Zapisano uprawnienia i zakończono sesje konta.",
                              )
                            }
                          >
                            {account.admin
                              ? "Odbierz dostęp administracyjny"
                              : "Nadaj dostęp administracyjny"}
                          </Button>
                          <form
                            className="prototype-form"
                            onSubmit={(event) => void reset(event, account.id)}
                          >
                            <Field label="Nowe hasło tymczasowe">
                              <Input
                                name="password"
                                type="password"
                                autoComplete="new-password"
                                minLength={8}
                                maxLength={128}
                                required
                              />
                            </Field>
                            <Button type="submit" variant="outline" disabled={pending}>
                              Ustaw hasło tymczasowe
                            </Button>
                          </form>
                          {result(account.id)}
                        </div>
                      </details>
                    )}
                  </li>
                );
              })}
            </ul>
          </section>
        </>
      )}
    </>
  );
}
