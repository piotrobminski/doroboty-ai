import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { initialState, type ServerAction, type State } from "./model";
import { STORAGE_KEY, parseState } from "./storage";
import { Button } from "@/components/ui/button";
import { API_HEADER, loginSchema } from "../auth/contract";

export async function requestState(path = "/api/state", input?: unknown): Promise<State> {
  let response: Response;
  try {
    response = await fetch(path, {
      method: input === undefined ? "GET" : "POST",
      headers: API_HEADER,
      credentials: "same-origin",
      signal: AbortSignal.timeout(15000),
      cache: "no-store",
      ...(input === undefined ? {} : { body: JSON.stringify(input) }),
    });
  } catch {
    throw new Error(
      "Nie można połączyć się z serwerem. Spróbuj ponownie; treść formularza pozostaje na stronie.",
    );
  }
  const value = await response.json().catch(() => null);
  if (!response.ok || !value || value.version !== 1)
    throw new Error(
      value?.error || "Baza danych jest niedostępna. Uruchom serwer aplikacji i spróbuj ponownie.",
    );
  return value as State;
}
function useStore() {
  const [state, setState] = useState(initialState);
  const [loading, setLoading] = useState(true);
  const [issue, setIssue] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(0);
  const [original] = useState(() => {
    try {
      return window.localStorage.getItem(STORAGE_KEY);
    } catch {
      return null;
    }
  });
  const queue = useRef(Promise.resolve());
  const clearError = useRef(() => setError("")).current;
  async function refresh() {
    try {
      setState(await requestState());
      setIssue("");
      setLoading(false);
    } catch {
      setIssue(
        "Nie można połączyć się z bazą danych. Sprawdź, czy serwer aplikacji działa, i spróbuj ponownie.",
      );
    }
  }
  useEffect(() => {
    document.body.dataset.saving = String(pending > 0);
  }, [pending]);
  useEffect(() => {
    document.documentElement.classList.remove("dark");
    void refresh();
  }, []);
  async function mutate(path: string, input: unknown): Promise<State | null> {
    document.body.dataset.saving = "true";
    setPending((n) => n + 1);
    let succeeded: State | null = null;
    const operation = queue.current.then(async () => {
      try {
        succeeded = await requestState(path, input);
        setState(succeeded);
        setError("");
      } catch (e) {
        setError(e instanceof Error ? e.message : "Nie udało się zapisać zmian. Spróbuj ponownie.");
      } finally {
        setPending((n) => n - 1);
      }
    });
    queue.current = operation;
    await operation;
    return succeeded;
  }
  return {
    state,
    loading,
    issue,
    error,
    original,
    pending: pending > 0,
    refresh,
    run: (action: ServerAction) => mutate("/api/actions", action),
    login: async (email: string, password: string) => {
      const parsed = loginSchema.safeParse({ email, password });
      if (!parsed.success) {
        setError(parsed.error.issues[0].message);
        return null;
      }
      return mutate("/api/auth/login", parsed.data);
    },
    logout: () => mutate("/api/auth/logout", {}),
    importState: async (raw: string) => {
      try {
        return await mutate("/api/scenario/import", parseState(raw));
      } catch (e) {
        setError((e as Error).message);
        return false;
      }
    },
    reset: () => mutate("/api/scenario/reset", {}),
    clearError,
  };
}
type Store = ReturnType<typeof useStore>;
const Context = createContext<Store | null>(null);
export function PrototypeProvider({ children }: { children: ReactNode }) {
  const store = useStore();
  if (store.loading)
    return (
      <main className="prototype-section prototype-form">
        <h1>DoRoboty.ai</h1>
        <p role="status">{store.issue || "Ładowanie danych…"}</p>
        {store.issue && (
          <Button type="button" onClick={() => void store.refresh()}>
            Spróbuj ponownie
          </Button>
        )}
      </main>
    );
  return <Context.Provider value={store}>{children}</Context.Provider>;
}
export function usePrototype() {
  const store = useContext(Context);
  if (!store) throw new Error("PrototypeProvider is required");
  return store;
}
