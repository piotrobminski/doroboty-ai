import { useState, type ChangeEvent } from "react";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { requestState, usePrototype } from "./store";
import { serializeState, MAX_IMPORT_BYTES } from "./storage";
import { currentPerson } from "./model";
import { PageTitle } from "./shell";
import { STATIC_DEMO } from "./runtime";
import { PasswordForm } from "../auth/password-form";

export function downloadText(name: string, text: string, type = "application/json") {
  const url = URL.createObjectURL(new Blob([text], { type }));
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
export function SettingsPage() {
  const { state, reset, importState, original, pending: saving } = usePrototype();
  const [pending, setPending] = useState<"reset" | "import" | null>(null);
  const [raw, setRaw] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const scenarioAccess = STATIC_DEMO
    ? currentPerson(state)?.role === "operator"
    : state.account?.admin;
  async function exportScenario() {
    setError("");
    try {
      const data = STATIC_DEMO ? state : await requestState("/api/scenario/export");
      downloadText("doroboty-scenariusz.json", serializeState(data));
    } catch (error) {
      setError((error as Error).message);
    }
  }
  async function readFile(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    setError("");
    if (!file) return;
    if (file.size > MAX_IMPORT_BYTES) {
      setError("Plik jest za duży (maksymalnie 2 MB).");
      return;
    }
    try {
      setRaw(await file.text());
      setPending("import");
    } catch {
      setError("Nie udało się odczytać pliku.");
    }
  }
  async function confirm() {
    if (pending === "reset") {
      if (await reset()) setMessage("Przywrócono scenariusz początkowy.");
    } else if (await importState(raw)) {
      setMessage("Dane zostały zaimportowane.");
    }
    setPending(null);
  }
  if (state.account?.mustChangePassword)
    return (
      <>
        <PageTitle description="Przed przejściem dalej zastąp hasło tymczasowe.">
          Ustawienia konta
        </PageTitle>
        <PasswordForm />
      </>
    );
  return (
    <>
      <PageTitle description="Zachowaj kopię swojej pracy, przenieś scenariusz lub zacznij od nowa.">
        Ustawienia prototypu
      </PageTitle>
      {!STATIC_DEMO && <PasswordForm />}
      {scenarioAccess ? (
        <section className="prototype-panel prototype-form">
          <h2>Dane scenariusza</h2>
          <p>
            {STATIC_DEMO ? (
              "Scenariusz jest zapisany wyłącznie w pamięci tej przeglądarki. Import i reset zmieniają tylko lokalne demo. Eksport pozwala przenieść scenariusz do innej przeglądarki. Logowanie nie zabezpiecza danych."
            ) : (
              <>
                Scenariusz jest zapisany we wspólnej bazie SQLite na serwerze. Import i reset
                zmieniają dane wszystkich kont. Eksport pozwala zachować kopię przed zmianą. Hasła,
                sesje i uprawnienia administracyjne są przechowywane osobno.
              </>
            )}
          </p>
          <div className="flex flex-wrap gap-3">
            <Button variant="outline" onClick={() => void exportScenario()}>
              Eksportuj dane
            </Button>
            <Button variant="outline" render={<label />}>
              Importuj dane
              <input
                className="sr-only"
                type="file"
                accept="application/json,.json"
                aria-label="Importuj plik scenariusza"
                onChange={readFile}
              />
            </Button>
            {original !== null && (
              <Button
                variant="outline"
                onClick={() =>
                  downloadText("doroboty-zapis-do-odzyskania.txt", original, "text/plain")
                }
              >
                Pobierz poprzedni zapis
              </Button>
            )}
          </div>
          {original !== null && (
            <Button
              variant="outline"
              disabled={saving}
              onClick={() => {
                setRaw(original);
                setPending("import");
              }}
            >
              {STATIC_DEMO
                ? "Zaimportuj poprzedni zapis demo"
                : "Przenieś poprzedni zapis z przeglądarki"}
            </Button>
          )}
          <Button disabled={saving} variant="destructive" onClick={() => setPending("reset")}>
            Resetuj scenariusz
          </Button>
          {error && (
            <p className="error-message" role="alert">
              {error}
            </p>
          )}
          {message && <p role="status">{message}</p>}
        </section>
      ) : (
        <section className="prototype-panel prototype-form">
          <h2>Dane konta</h2>
          <p>
            {STATIC_DEMO ? (
              "Zmiany są zapisywane tylko w tej przeglądarce. Nie synchronizują się z innymi osobami. Eksport, import i reset znajdziesz na koncie demonstracyjnym prowadzącego."
            ) : (
              <>
                Zmiany są zapisywane w bazie danych. Eksport, import i reset całego scenariusza są
                dostępne dla administratora.
              </>
            )}
          </p>
        </section>
      )}
      <section className="prototype-panel prototype-form mt-6">
        <h2>O prototypie</h2>
        <p>
          {STATIC_DEMO
            ? "Wybór konta przez e-mail i hasło jest symulacją, bez zabezpieczenia danych. "
            : "Dostęp do konta wymaga adresu e-mail i hasła. "}
          Match Score i podsumowania odtwarzają przygotowany scenariusz. Formularz rekrutera
          proponuje umiejętności i pytania na podstawie opisu stanowiska; rekruter samodzielnie je
          poprawia i zatwierdza. Używaj przykładowych danych i CV.
        </p>
      </section>
      <ConfirmDialog
        open={pending !== null}
        onOpenChange={(v) => {
          if (!v) setPending(null);
        }}
        title={pending === "reset" ? "Zresetować scenariusz?" : "Zastąpić dane scenariusza?"}
        description={
          STATIC_DEMO
            ? "Ta operacja zastąpi scenariusz tylko w tej przeglądarce. Możesz najpierw wyeksportować dane lub pobrać poprzedni zapis."
            : "Ta operacja zastąpi wspólny scenariusz w bazie. Konta i hasła pozostaną bez zmian. Możesz najpierw wyeksportować dane."
        }
        label={pending === "reset" ? "Resetuj" : "Importuj"}
        pending={saving}
        onConfirm={confirm}
      />
    </>
  );
}
export function PrivacyPage() {
  return (
    <section className="prototype-section max-w-4xl">
      <PageTitle
        eyebrow="Informacje / Twoje dane"
        description="Jak działa zapis danych i dostęp do kont."
      >
        Prywatność prototypu
      </PageTitle>
      <div className="mt-6 space-y-5">
        <p>
          Ta wersja służy do ćwiczeń i testów interfejsu. Nie wpisuj prawdziwych danych osobowych
          ani poufnych informacji.
        </p>
        <p>
          {STATIC_DEMO ? (
            "Profile, CV, oferty i odpowiedzi pozostają tylko w pamięci tej przeglądarki. Logowanie i podział ról są symulowane i nie chronią danych. Nie ma wspólnej bazy ani synchronizacji pomiędzy przeglądarkami. Eksportowany plik obejmuje cały scenariusz, w tym notatki rekrutera. "
          ) : (
            <>
              Profile, CV, oferty i odpowiedzi są zapisywane w bazie SQLite na serwerze aplikacji.
              Dostęp do danych zależy od zalogowanego konta. Prowadzący ma dostęp do całego
              scenariusza i jego eksportu, w tym notatek rekrutera. Eksport nie zawiera haseł ani
              sesji. Aplikacja nie wysyła danych do systemu analitycznego.
            </>
          )}
        </p>
        <p>
          Propozycje umiejętności i pytań w formularzu oferty powstają w tej przeglądarce. Opis
          stanowiska nie jest przesyłany do zewnętrznego dostawcy. Rekruter sprawdza i zatwierdza
          treść; system nie ocenia kandydatów. Postęp formularza jest częścią{" "}
          {STATIC_DEMO ? "lokalnego" : "wspólnego"} scenariusza oraz jego eksportu i resetu.
        </p>
        <p>
          {STATIC_DEMO ? (
            "Scenariusz możesz przenieść przez eksport i import na koncie demonstracyjnym prowadzącego. Wyczyszczenie danych przeglądarki usuwa lokalne demo. Pracuj w jednej karcie naraz. Hosting może prowadzić własne logi dostępu."
          ) : (
            <>
              Prowadzący może przywrócić scenariusz w ustawieniach. Wyczyszczenie danych
              przeglądarki wylogowuje konto, ale nie usuwa danych z bazy. Sesja jest przechowywana w
              pliku cookie i wygasa po 12 godzinach. Hosting może prowadzić własne logi dostępu.
            </>
          )}
        </p>
      </div>
    </section>
  );
}
