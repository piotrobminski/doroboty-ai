import { accountEmail, loginSchema } from "../auth/contract";
import {
  actionSchema,
  archiveCompletedRecruitments,
  currentPerson,
  initialState,
  transition,
  type State,
} from "./model";
import { MAX_IMPORT_BYTES, parseState, serializeState, type StoragePort } from "./storage";
import { projectState } from "./projection";

export const DEMO_STORAGE_KEY = "doroboty.static-demo.v1";

/** Explicit, synthetic browser simulation. No password or role here provides security. */
export function createStaticDemo(storage: StoragePort | null) {
  let state = initialState();
  let issue = "";
  let original: string | null = null;
  let blocked = false;
  try {
    if (!storage) throw new Error("Storage unavailable");
    original = storage.getItem(DEMO_STORAGE_KEY);
    if (original !== null) state = parseState(original);
    original = null;
  } catch {
    blocked = true;
    issue =
      "Nie można odczytać zapisu demo. Dane nie zostaną nadpisane. Zaloguj się jako prowadzący i otwórz ustawienia, aby pobrać zapis lub przywrócić scenariusz.";
  }
  function commit(next: State, recovery = false) {
    if (blocked && !recovery)
      throw new Error(
        "Zapis demo jest zablokowany. Pobierz poprzedni zapis w ustawieniach prowadzącego, a następnie zaimportuj poprawny plik lub zresetuj scenariusz.",
      );
    next = archiveCompletedRecruitments(next);
    const raw = serializeState(next);
    if (new TextEncoder().encode(raw).length > MAX_IMPORT_BYTES)
      throw new Error("Dane przekraczają 2 MB. Wyeksportuj scenariusz.");
    try {
      if (!storage) throw new Error("Storage unavailable");
      storage.setItem(DEMO_STORAGE_KEY, raw);
    } catch {
      throw new Error(
        "Nie udało się zapisać zmian w przeglądarce. Sprawdź dostęp do pamięci i spróbuj ponownie; treść formularza pozostaje bez zmian.",
      );
    }
    state = next;
    blocked = false;
    original = null;
    issue = "";
  }
  function select(personId: string | null) {
    const next = { ...state, activePersonId: personId };
    // A simulated role may be selected in memory to reach recovery controls.
    if (blocked) state = next;
    else {
      try {
        commit(next);
      } catch (error) {
        state = next;
        issue = (error as Error).message;
      }
    }
  }
  function request(path = "/api/state", input?: unknown): State {
    const archived = archiveCompletedRecruitments(state);
    if (!blocked && archived !== state) {
      try {
        commit(archived);
      } catch (error) {
        issue = (error as Error).message;
      }
    }
    if (path === "/api/state" && input === undefined)
      return projectState(state, state.activePersonId);
    if (path === "/api/auth/login") {
      const credentials = loginSchema.parse(input);
      const person = state.people.find(
        (person) => accountEmail(person.id).toLowerCase() === credentials.email.toLowerCase(),
      );
      if (!person || credentials.password !== "Test1234")
        throw new Error("Nieprawidłowy e-mail lub hasło.");
      select(person.id);
    } else if (path === "/api/auth/logout") select(null);
    else {
      const person = currentPerson(state);
      if (!person) throw new Error("Wybierz konto demonstracyjne, aby kontynuować.");
      if (path === "/api/actions") {
        const action = actionSchema.parse(input);
        if (
          (action.type === "toggle_saved" || action.type === "draft") &&
          !state.jobs.some(
            (job) => job.id === action.jobId && job.publicationStatus === "published",
          )
        )
          throw new Error("Oferta nie jest dostępna.");
        commit(transition(state, action));
      } else {
        if (person.role !== "operator") throw new Error("Wymagane konto prowadzącego.");
        let next: State;
        if (path === "/api/scenario/import") {
          next = parseState(JSON.stringify(input));
          for (const existing of state.people) {
            const replacement = next.people.find((item) => item.id === existing.id);
            if (
              !replacement ||
              replacement.role !== existing.role ||
              replacement.companyId !== existing.companyId
            )
              throw new Error(
                "Import musi zachować istniejące konta, ich role i przypisania do firm.",
              );
          }
        } else if (path === "/api/scenario/reset") {
          next = initialState();
          next.people = state.people;
          for (const company of state.companies)
            if (!next.companies.some((item) => item.id === company.id))
              next.companies.push(company);
        } else throw new Error("Nie znaleziono operacji.");
        commit({ ...next, activePersonId: person.id }, true);
      }
    }
    return projectState(state, state.activePersonId);
  }
  return {
    request,
    get issue() {
      return issue;
    },
    get original() {
      return original;
    },
  };
}
