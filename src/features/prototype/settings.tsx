import { useState, type ChangeEvent } from "react";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { usePrototype } from "./store";
import { serializeState, MAX_IMPORT_BYTES } from "./storage";
import { currentPerson } from "./model";
import { PageTitle } from "./shell";

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
  return (
    <>
      <PageTitle description="Zachowaj kopię swojej pracy, przenieś scenariusz lub zacznij od nowa.">
        Ustawienia prototypu
      </PageTitle>
      {currentPerson(state)?.role === "operator" ? (
        <section className="prototype-panel prototype-form">
          <h2>Dane scenariusza</h2>
          <p>
            Scenariusz jest zapisany we wspólnej bazie SQLite na serwerze. Import i reset zmieniają
            dane wszystkich kont. Eksport pozwala zachować kopię przed zmianą. Hasła i sesje nie są
            częścią eksportu.
          </p>
          <div className="flex flex-wrap gap-3">
            <Button
              variant="outline"
              onClick={() => downloadText("doroboty-scenariusz.json", serializeState(state))}
            >
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
              Przenieś poprzedni zapis z przeglądarki
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
            Zmiany są zapisywane w bazie danych. Eksport, import i reset całego scenariusza są
            dostępne na koncie prowadzącego.
          </p>
        </section>
      )}
      <section className="prototype-panel prototype-form mt-6">
        <h2>O prototypie</h2>
        <p>
          Dostęp do konta wymaga adresu e-mail i hasła. Match Score i podsumowania odtwarzają
          przygotowany scenariusz. Formularz rekrutera proponuje umiejętności i pytania na podstawie
          opisu stanowiska; rekruter samodzielnie je poprawia i zatwierdza. Używaj przykładowych
          danych i CV.
        </p>
      </section>
      <ConfirmDialog
        open={pending !== null}
        onOpenChange={(v) => {
          if (!v) setPending(null);
        }}
        title={pending === "reset" ? "Zresetować scenariusz?" : "Zastąpić dane scenariusza?"}
        description="Ta operacja zastąpi wspólny scenariusz w bazie. Konta i hasła pozostaną bez zmian. Możesz najpierw wyeksportować dane."
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
          Profile, CV, oferty i odpowiedzi są zapisywane w bazie SQLite na serwerze aplikacji.
          Dostęp do danych zależy od zalogowanego konta. Prowadzący ma dostęp do całego scenariusza
          i jego eksportu, w tym notatek rekrutera. Eksport nie zawiera haseł ani sesji. Aplikacja
          nie wysyła danych do systemu analitycznego.
        </p>
        <p>
          Propozycje umiejętności i pytań w formularzu oferty powstają w tej przeglądarce. Opis
          stanowiska nie jest przesyłany do zewnętrznego dostawcy. Rekruter sprawdza i zatwierdza
          treść; system nie ocenia kandydatów. Postęp formularza jest częścią wspólnego scenariusza
          oraz jego eksportu i resetu.
        </p>
        <p>
          Prowadzący może przywrócić scenariusz w ustawieniach. Wyczyszczenie danych przeglądarki
          wylogowuje konto, ale nie usuwa danych z bazy. Sesja jest przechowywana w pliku cookie i
          wygasa po 12 godzinach. Hosting może prowadzić własne logi dostępu.
        </p>
      </div>
    </section>
  );
}
