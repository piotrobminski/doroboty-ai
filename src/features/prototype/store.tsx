import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { initialState, type ServerAction, type State } from "./model";
import { STORAGE_KEY, parseState } from "./storage";
import { Button } from "@/components/ui/button";
import { API_HEADER, loginSchema, type AccountAccess, type RecoveryMode } from "../auth/contract";
import { STATIC_DEMO } from "./runtime";
import { createStaticDemo } from "./static-demo";

let demo: ReturnType<typeof createStaticDemo> | undefined;
function staticDemo() {
  if (!demo) {
    let storage = null;
    try {
      storage = window.localStorage;
    } catch {
      /* Recovery remains available in memory. */
    }
    demo = createStaticDemo(storage);
  }
  return demo;
}

export async function requestJson(path: string, input?: unknown): Promise<unknown> {
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
  if (!response.ok || !value)
    throw new Error(
      value?.error || "Baza danych jest niedostępna. Uruchom serwer aplikacji i spróbuj ponownie.",
    );
  return value;
}
type SessionState = State & { account?: AccountAccess; recoveryMode?: RecoveryMode };
export async function requestState(path = "/api/state", input?: unknown): Promise<SessionState> {
  if (STATIC_DEMO) return staticDemo().request(path, input);
  const value = (await requestJson(path, input)) as SessionState;
  if (value.version !== 1) throw new Error("Otrzymano nieprawidłowe dane scenariusza.");
  return value;
}
function useStore() {
  const [state, setState] = useState<SessionState>(initialState);
  const [recoveryMode, setRecoveryMode] = useState<RecoveryMode>("off");
  const [loading, setLoading] = useState(true);
  const [issue, setIssue] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(0);
  const [original] = useState(() => {
    if (STATIC_DEMO) return staticDemo().original;
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
      const next = await requestState();
      setState(next);
      if (!STATIC_DEMO) setRecoveryMode(next.recoveryMode ?? "off");
      if (STATIC_DEMO) setIssue(staticDemo().issue);
      else setIssue("");
      setLoading(false);
    } catch (error) {
      setIssue(
        STATIC_DEMO
          ? (error as Error).message
          : "Nie można połączyć się z bazą danych. Sprawdź, czy serwer aplikacji działa, i spróbuj ponownie.",
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
  async function mutate(path: string, input: unknown): Promise<SessionState | null> {
    document.body.dataset.saving = "true";
    setPending((n) => n + 1);
    let succeeded: SessionState | null = null;
    const operation = queue.current.then(async () => {
      try {
        succeeded = await requestState(path, input);
        setState(succeeded);
        if (STATIC_DEMO) setIssue(staticDemo().issue);
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
    recoveryMode,
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
    changePassword: (input: { currentPassword: string; newPassword: string }) =>
      mutate("/api/auth/change-password", input),
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
