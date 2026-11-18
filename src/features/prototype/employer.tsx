import { useRef, useState, type FormEvent } from "react";
import { Link, useSearchParams } from "react-router";
import { FormSection } from "@/components/form-section";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { archiveDueAt, currentPerson, isFinalStage, type State } from "./model";
import { usePrototype } from "./store";
import { Field } from "./workspace";
import { Empty, PageTitle } from "./shell";
import { ArchiveLinks } from "./archive-links";

const jobStatuses: Record<State["jobs"][number]["publicationStatus"], string> = {
  draft: "Szkic",
  review: "Do weryfikacji",
  published: "Opublikowana",
  hidden: "Ukryta",
  expired: "Wygasła",
  archived: "Zarchiwizowana",
};
const archiveDate = new Intl.DateTimeFormat("pl-PL", { dateStyle: "medium", timeStyle: "short" });

export function EmployerJobs() {
  const { state, run, pending } = usePrototype();
  const [params] = useSearchParams();
  const [closingId, setClosingId] = useState<string | null>(null);
  const [closingError, setClosingError] = useState("");
  const trigger = useRef<HTMLButtonElement>(null);
  const archived = params.get("archiwum") === "1";
  const person = currentPerson(state)!;
  const jobs = state.jobs.filter(
    (job) =>
      job.companyId === person.companyId && (job.publicationStatus === "archived") === archived,
  );
  function dismiss() {
    setClosingId(null);
    setClosingError("");
    requestAnimationFrame(() => trigger.current?.focus());
  }
  async function closeRecruitment() {
    if (!closingId) return;
    if (await run({ type: "close_recruitment", jobId: closingId })) {
      setClosingId(null);
      requestAnimationFrame(() => document.getElementById(`recruitment-${closingId}`)?.focus());
    } else
      setClosingError(
        "Nie udało się zakończyć rekrutacji. Sprawdź status aplikacji i spróbuj ponownie.",
      );
  }
  return (
    <>
      <PageTitle
        description="Buduj zespół wokół konkretnych zadań. Zarządzaj swoimi rolami i zgłoszeniami."
        action={
          <Link to="/app/oferty/nowa" className={buttonVariants()}>
            Dodaj ofertę
          </Link>
        }
      >
        Moje oferty
      </PageTitle>
      <ArchiveLinks current="Oferty bieżące" archive="Archiwum ofert" />
      <div className="space-y-4">
        {jobs.length ? (
          jobs.map((job) => {
            const applications = state.applications.filter((item) => item.jobId === job.id);
            const open = applications.filter((item) => !isFinalStage(item.stage)).length;
            const isPublished = job.publicationStatus === "published";
            const archiveSearch = new URLSearchParams({ oferta: job.id });
            if (archived) archiveSearch.set("archiwum", "1");
            return (
              <article key={job.id} className="prototype-panel">
                <div className="flex flex-wrap justify-between gap-4">
                  <div className="min-w-0 wrap-anywhere">
                    <Link className="work-list-title" to={`/app/oferty/${job.id}`}>
                      {job.title}
                    </Link>
                    <p className="mt-3 text-muted-foreground">
                      {isPublished && job.competencyCard && (
                        <Link
                          className="block mb-3 text-[var(--gui-link)] underline"
                          to={`/auth/sign-in?audience=candidate&next=${encodeURIComponent(`/aplikuj/${job.slug}`)}`}
                        >
                          Formularz karty PR02
                        </Link>
                      )}
                      <Link
                        className="underline"
                        to={{ pathname: "/app/kandydaci", search: archiveSearch.toString() }}
                      >
                        Aplikacje ({applications.length})
                      </Link>{" "}
                      ·{" "}
                      <span id={`recruitment-${job.id}`} tabIndex={-1}>
                        {!archived && job.recruitmentClosedAt
                          ? "Rekrutacja zakończona"
                          : jobStatuses[job.publicationStatus]}
                      </span>
                    </p>
                    {!archived && job.recruitmentClosedAt && (
                      <p className="mt-2 text-sm">
                        Archiwizacja: {archiveDate.format(archiveDueAt(job.recruitmentClosedAt))}
                      </p>
                    )}
                    {isPublished && open > 0 && (
                      <p className="mt-2 text-sm text-muted-foreground">
                        Otwarte aplikacje: {open}. Zakończ je przed zamknięciem rekrutacji.
                      </p>
                    )}
                  </div>
                  {isPublished && (
                    <div className="flex flex-wrap items-start gap-2">
                      <Link
                        to={`/oferty/${job.slug}`}
                        className={buttonVariants({ variant: "outline", size: "sm" })}
                      >
                        Zobacz ofertę
                      </Link>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={open > 0 || pending}
                        onClick={(event) => {
                          trigger.current = event.currentTarget;
                          setClosingId(job.id);
                        }}
                      >
                        Zakończ rekrutację
                      </Button>
                    </div>
                  )}
                </div>
              </article>
            );
          })
        ) : (
          <Empty>
            {archived
              ? "Brak zarchiwizowanych ofert."
              : "Brak bieżących ofert. Dodaj ofertę lub przejdź do archiwum."}
          </Empty>
        )}
      </div>
      <ConfirmDialog
        open={closingId !== null}
        onOpenChange={(open) => {
          if (!open) dismiss();
        }}
        title="Zakończyć rekrutację?"
        description="Oferta przestanie przyjmować zgłoszenia. Po 90 dniach oferta i jej aplikacje trafią do archiwum. Zachowasz dostęp do ich historii i materiałów."
        label="Zakończ rekrutację"
        pending={pending}
        error={closingError}
        onConfirm={() => void closeRecruitment()}
      />
    </>
  );
}
export { EmployerJobEditor } from "./job-editor";
export function CompanyEditor() {
  const { state, run } = usePrototype();
  const person = currentPerson(state)!;
  const company = state.companies.find((x) => x.id === person.companyId)!;
  const [message, setMessage] = useState("");
  async function save(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    if (
      await run({
        type: "company",
        name: String(data.get("name")),
        description: String(data.get("description")),
      })
    )
      setMessage("Dane firmy zostały zapisane.");
  }
  return (
    <>
      <PageTitle description="Pokaż kandydatom, kim jesteście i nad czym pracujecie.">
        Twoja organizacja
      </PageTitle>
      <form className="prototype-panel prototype-form" onSubmit={save}>
        <FormSection index="01" title="Poznaj firmę">
          <Field label="Nazwa firmy">
            <Input name="name" required maxLength={200} defaultValue={company.name} />
          </Field>
          <Field label="Opis firmy">
            <Textarea name="description" maxLength={12000} defaultValue={company.description} />
          </Field>
        </FormSection>
        <Button type="submit">Zapisz dane firmy</Button>
        {message && <p role="status">{message}</p>}
        <Link className="text-[var(--gui-link)]" to={`/firmy/${company.slug}`}>
          Zobacz profil firmy
        </Link>
      </form>
    </>
  );
}
