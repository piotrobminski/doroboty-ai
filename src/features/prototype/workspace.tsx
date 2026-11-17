import { LoginPage } from "../auth/login";
import {
  cloneElement,
  useId,
  useEffect,
  useRef,
  useState,
  type FormEvent,
  type ReactNode,
  type ReactElement,
} from "react";
import { Link, Navigate, useNavigate, useParams, useSearchParams } from "react-router";
import { CheckCircle2, FileText } from "lucide-react";
import { ConfettiBurst, type ConfettiOrigin } from "@/components/confetti-burst";
import { FormSection } from "@/components/form-section";
import { BackLink } from "@/components/back-link";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { JobCard } from "@/features/jobs/job-card";
import { ApplicationOfferPreview } from "@/features/jobs/application-offer-preview";
import { usePrototype } from "./store";
import { currentPerson, publishedJobs, stageLabels, MIN_APPLICATION_ANSWER_LENGTH } from "./model";
import { PageTitle, Empty, NotFound, Notice } from "./shell";
import { CvAttachment } from "./cv-attachment";
import { MatchScore } from "./match-score";
import { RecruitingApplication } from "./recruiting-application";
import { CandidateApplication } from "./candidate-application";
import { CompetencyResponses, SavedCompetencyExamples } from "./competency-responses";
import { competencySubmissionSchema, type CompetencyResponse } from "./competency";

export function Field({
  label,
  children,
}: {
  label: string;
  children: ReactElement<{ id?: string; "aria-labelledby"?: string }>;
}) {
  const generatedId = useId();
  const id = children.props.id ?? generatedId;
  const labelId = `${generatedId}-label`;
  return (
    <div className="field">
      <label id={labelId} htmlFor={id}>
        {label}
      </label>
      {cloneElement(children, { id, "aria-labelledby": labelId })}
    </div>
  );
}
export function RequireRole({
  role,
  children,
}: {
  role?: "candidate" | "employer" | "operator";
  children: ReactNode;
}) {
  const { state } = usePrototype();
  const person = currentPerson(state);
  if (!person) return <LoginPage />;
  if (role && person.role !== role)
    return (
      <Empty>
        <h1 className="mb-4">Zaloguj się na właściwe konto</h1>
        <p className="mb-4">
          Ten widok jest dostępny dla{" "}
          {role === "candidate" ? "kandydata" : role === "employer" ? "pracodawcy" : "prowadzącego"}
          .
        </p>
        <Link className={buttonVariants({ variant: "outline" })} to="/auth/sign-in">
          Zmień konto
        </Link>
      </Empty>
    );
  return children;
}
export function WorkspaceHome() {
  const { state } = usePrototype();
  const person = currentPerson(state)!;
  if (person.role === "operator") return <Navigate to="/app/case" replace />;
  const candidate = person.role === "candidate";
  const applications = state.applications.filter((a) =>
    candidate ? a.candidateId === person.id : a.companyId === person.companyId,
  );
  return (
    <>
      <PageTitle
        description={
          candidate
            ? "Twoje kolejne kroki, zapisane role i aplikacje — w jednym miejscu."
            : "Twoje oferty, kandydaci i decyzje — w jednym miejscu."
        }
      >
        Witaj, {person.name.split(" ")[0]}
      </PageTitle>
      <div className="metric-grid">
        {[
          ["Aplikacje", applications.length],
          [
            candidate ? "Zapisane oferty" : "Twoje oferty",
            candidate
              ? state.saved.filter((x) => x.candidateId === person.id).length
              : state.jobs.filter((x) => x.companyId === person.companyId).length,
          ],
          [
            "W trakcie procesu",
            applications.filter((x) => !["rejected", "withdrawn", "hired"].includes(x.stage))
              .length,
          ],
        ].map(([label, value]) => (
          <div className="prototype-panel" key={label}>
            <p className="metric-label">{label}</p>
            <strong className="metric-number">{value}</strong>
          </div>
        ))}
      </div>
      <div className="workspace-actions">
        <Link className={buttonVariants()} to={candidate ? "/oferty" : "/app/kandydaci"}>
          {candidate ? "Przeglądaj oferty" : "Przejrzyj kandydatów"}
        </Link>
        <Link
          className={buttonVariants({ variant: "outline" })}
          to={candidate ? "/app/profil" : "/app/oferty"}
        >
          {candidate ? "Edytuj profil" : "Zarządzaj ofertami"}
        </Link>
      </div>
    </>
  );
}
export function ProfilePage({ preview = false }: { preview?: boolean }) {
  const { state, run } = usePrototype();
  const person = currentPerson(state)!;
  const [message, setMessage] = useState("");
  async function save(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    if (
      await run({
        type: "profile",
        value: {
          name: String(data.get("name")),
          headline: String(data.get("headline")),
          bio: String(data.get("bio")),
          location: String(data.get("location")),
        },
      })
    )
      setMessage("Profil został zapisany.");
  }
  return (
    <>
      <PageTitle
        description={
          preview
            ? "Tak prezentuje się Twój profil w tym scenariuszu."
            : "Opowiedz o sobie. Zmiany profilu nie zmieniają wysłanych aplikacji."
        }
        action={
          <Link
            to={preview ? "/app/profil" : "/app/profil/podglad"}
            className={buttonVariants({ variant: "outline" })}
          >
            {preview ? "Edytuj profil" : "Podgląd profilu"}
          </Link>
        }
      >
        {preview ? person.name : "Twój profil"}
      </PageTitle>
      {preview ? (
        <div className="prototype-panel space-y-4">
          <h2>{person.headline}</h2>
          <p>{person.location}</p>
          <p>{person.bio}</p>
        </div>
      ) : (
        <form onSubmit={save} className="prototype-panel prototype-form">
          <FormSection
            index="01"
            title="Poznajmy się"
            description="Tożsamość i doświadczenie, które chcesz pokazać."
          >
            <Field label="Imię i nazwisko">
              <Input name="name" required maxLength={200} defaultValue={person.name} />
            </Field>
            <Field label="Nagłówek zawodowy">
              <Input name="headline" required maxLength={200} defaultValue={person.headline} />
            </Field>
            <Field label="Lokalizacja">
              <Input name="location" required maxLength={200} defaultValue={person.location} />
            </Field>
            <Field label="O mnie">
              <Textarea name="bio" maxLength={12000} defaultValue={person.bio} />
            </Field>
          </FormSection>
          <Button type="submit">Zapisz profil</Button>
          {message && <p role="status">{message}</p>}
        </form>
      )}
      <section className="prototype-panel mt-6">
        <h2 className="mb-4 flex items-center gap-2">
          <FileText className="size-5" />
          CV
        </h2>
        <CvAttachment candidateId={person.id} fallbackText={person.cv} />
      </section>
    </>
  );
}
export function SavedPage() {
  const { state } = usePrototype();
  const person = currentPerson(state)!;
  const jobs = publishedJobs(state).filter((job) =>
    state.saved.some((x) => x.candidateId === person.id && x.jobId === job.id),
  );
  return (
    <>
      <PageTitle description="Role, do których chcesz wrócić. Zapisane osobno dla Twojego profilu.">
        Zapisane oferty
      </PageTitle>
      {jobs.length ? (
        <div className="tph-job-list">
          {jobs.map((job) => (
            <JobCard key={job.id} job={job} saved />
          ))}
        </div>
      ) : (
        <Empty>
          <p className="mb-4">Nie masz jeszcze zapisanych ofert.</p>
          <Link className={buttonVariants({ variant: "outline" })} to="/oferty">
            Przeglądaj oferty
          </Link>
        </Empty>
      )}
    </>
  );
}
export function ApplyPage() {
  const { slug } = useParams();
  const { state, run, pending } = usePrototype();
  const person = currentPerson(state)!;
  const navigate = useNavigate();
  const job = publishedJobs(state).find((x) => x.slug === slug);
  const draft = state.drafts.find((x) => x.jobId === job?.id && x.candidateId === person.id);
  const notes = draft?.notes ?? "";
  const generated = draft?.generated ?? "";
  const [answer, setAnswer] = useState(draft?.answer ?? "");
  const [responses, setResponses] = useState<CompetencyResponse[]>(
    draft?.competencyResponses ?? [],
  );
  const [consent, setConsent] = useState(false);
  const [message, setMessage] = useState("");
  const [attempted, setAttempted] = useState(false);
  const answerInput = useRef<HTMLTextAreaElement>(null);
  const consentInput = useRef<HTMLSpanElement>(null);
  const sendButton = useRef<HTMLButtonElement>(null);
  const submittedOnce = useRef(false);
  const [submitted, setSubmitted] = useState(false);
  const [confettiOrigin, setConfettiOrigin] = useState<ConfettiOrigin | null>(null);
  useEffect(() => {
    if (!submitted) return;
    const delay = window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : 900;
    const timeout = window.setTimeout(() => navigate("/app/aplikacje?wyslano=1"), delay);
    return () => window.clearTimeout(timeout);
  }, [submitted, navigate]);
  const answerLength = answer.trim().length;
  const answerInvalid = attempted && answerLength < MIN_APPLICATION_ANSWER_LENGTH;
  const consentInvalid = attempted && !consent;
  if (!job) return <NotFound />;
  const existing = state.applications.find(
    (x) => x.jobId === job.id && x.candidateId === person.id,
  );
  if (existing && !submitted)
    return (
      <section className="prototype-section">
        <Notice>Aplikacja na tę ofertę została już wysłana.</Notice>
        <Link to={`/app/aplikacje/${existing.id}`} className={buttonVariants()}>
          Zobacz aplikację
        </Link>
      </section>
    );
  async function submit(e: FormEvent) {
    e.preventDefault();
    if (submittedOnce.current) return;
    setAttempted(true);
    if (job!.competencyCard) {
      const parsed = competencySubmissionSchema.safeParse({
        card: job!.competencyCard,
        responses: responses.filter((response) =>
          job!.competencyCard!.criteria.some((criterion) => criterion.id === response.criterionId),
        ),
      });
      if (!parsed.success) {
        const missing = job!.competencyCard.criteria.find(
          (criterion) =>
            !responses.some(
              (response) =>
                response.criterionId === criterion.id && response.example.trim().length >= 20,
            ),
        );
        document.getElementById(`example-${missing?.id}`)?.focus();
        return;
      }
    } else if (answerLength < MIN_APPLICATION_ANSWER_LENGTH) {
      answerInput.current?.focus();
      return;
    }
    if (!consent) {
      consentInput.current?.focus();
      return;
    }
    submittedOnce.current = true;
    if (
      await run({
        type: "submit",
        jobId: job!.id,
        notes,
        generated,
        answer,
        consent,
        competencyRevision: job!.competencyCard?.approvedAt,
        competencyResponses: responses.filter((response) =>
          job!.competencyCard?.criteria.some((criterion) => criterion.id === response.criterionId),
        ),
      })
    ) {
      setSubmitted(true);
      if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        const rect = sendButton.current?.getBoundingClientRect();
        if (rect)
          setConfettiOrigin({ x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 });
      }
    } else submittedOnce.current = false;
  }
  return (
    <section className="tph-container application-page">
      <BackLink to={`/oferty/${job.slug}`}>Wróć do oferty</BackLink>
      <header className="application-header">
        <h1>Aplikuj na ofertę</h1>
        <p>Sprawdź ofertę i opowiedz, dlaczego pasujesz do tej roli.</p>
      </header>
      <div className="application-layout">
        <ApplicationOfferPreview job={job} />
        <form
          noValidate
          onSubmit={submit}
          className="record-sheet application-form"
          aria-labelledby="application-form-title"
        >
          <header className="application-form-intro">
            <h2 id="application-form-title">Twoja aplikacja</h2>
            <p>
              Aplikujesz jako <strong>{person.name}</strong>.
            </p>
          </header>
          <section className="application-form-section" aria-labelledby="application-cv-title">
            <h3 id="application-cv-title">Twoje CV</h3>
            <p className="application-help">Do aplikacji dołączymy CV z Twojego profilu.</p>
            <CvAttachment
              candidateId={person.id}
              fallbackText={person.cv}
              layout="row"
              contextLabel="CV z Twojego profilu"
            />
          </section>
          {job.competencyCard ? (
            <>
              {draft?.competencyRevision &&
                draft.competencyRevision !== job.competencyCard.approvedAt && (
                  <Notice>
                    Karta kryteriów zmieniła się od zapisu szkicu. Sprawdź aktualne wymagania i
                    swoje odpowiedzi.
                  </Notice>
                )}
              <CompetencyResponses
                card={job.competencyCard}
                responses={responses}
                attempted={attempted}
                disabled={submitted || pending}
                onChange={(value) => {
                  setResponses(value);
                  setConsent(false);
                  setMessage("");
                }}
              />
            </>
          ) : (
            <section
              className="application-form-section application-answer"
              aria-label="Odpowiedź do aplikacji"
            >
              <SavedCompetencyExamples responses={responses} cardRemoved />
              <Field label="Dlaczego pasujesz do tej roli?">
                <Textarea
                  disabled={submitted || pending}
                  ref={answerInput}
                  required
                  minLength={MIN_APPLICATION_ANSWER_LENGTH}
                  maxLength={12000}
                  aria-invalid={answerInvalid || undefined}
                  aria-describedby="application-answer-help"
                  value={answer}
                  onChange={(e) => {
                    setAnswer(e.target.value);
                    setConsent(false);
                  }}
                />
              </Field>
              <p
                id="application-answer-help"
                role={answerInvalid ? "alert" : undefined}
                className={answerInvalid ? "error-message" : "text-sm text-muted-foreground"}
              >
                {answerInvalid
                  ? `Odpowiedź jest za krótka. Wpisz co najmniej ${MIN_APPLICATION_ANSWER_LENGTH} znaków (obecnie: ${answerLength}).`
                  : `Minimum ${MIN_APPLICATION_ANSWER_LENGTH} znaków. Obecnie: ${answerLength}.`}
              </p>
            </section>
          )}
          <div className="application-form-section application-submit">
            <label className="checkbox-field application-consent">
              <Checkbox
                id="application-consent"
                ref={consentInput}
                disabled={submitted || pending}
                checked={consent}
                onCheckedChange={(v) => setConsent(v)}
                aria-invalid={consentInvalid || undefined}
                aria-describedby={consentInvalid ? "application-consent-error" : undefined}
                aria-labelledby="application-consent-label"
              />
              <span id="application-consent-label">
                Zatwierdzam treść aplikacji i przesłanie profilu oraz przykładowego CV pracodawcy.
              </span>
            </label>
            {consentInvalid && (
              <p id="application-consent-error" className="error-message" role="alert">
                Zatwierdź treść aplikacji i jej przesłanie pracodawcy.
              </p>
            )}
            <div className="application-actions">
              <Button
                ref={sendButton}
                variant="lime"
                type="submit"
                disabled={submitted || pending}
                className="application-send"
              >
                {submitted && <CheckCircle2 aria-hidden="true" />}
                {submitted ? "Wysłano!" : "Wyślij aplikację"}
              </Button>
              <Button
                type="button"
                disabled={submitted || pending}
                variant="outline"
                onClick={async () => {
                  if (
                    await run({
                      type: "draft",
                      jobId: job.id,
                      notes,
                      generated,
                      answer,
                      ...(job.competencyCard || responses.length
                        ? {
                            competencyResponses: responses,
                            competencyRevision:
                              job.competencyCard?.approvedAt ?? draft?.competencyRevision,
                          }
                        : {}),
                    })
                  )
                    setMessage("Szkic został zapisany.");
                }}
              >
                Zapisz szkic
              </Button>
            </div>
            <p
              role="status"
              className={submitted || !message ? "sr-only" : "application-save-status"}
            >
              {submitted ? "Wysłano aplikację. Otwieramy listę Twoich aplikacji." : message}
            </p>
            <p className="application-help">
              Prototyp: aplikacja zostaje zapisana w bazie i jest dostępna dla pracodawcy.
            </p>
          </div>
        </form>
      </div>
      <ConfettiBurst origin={confettiOrigin} />
    </section>
  );
}
export function ApplicationsPage({ employer = false }: { employer?: boolean }) {
  const { state } = usePrototype();
  const person = currentPerson(state)!;
  const [query, setQuery] = useState("");
  const [params] = useSearchParams();
  const applications = state.applications.filter(
    (x) =>
      (employer ? x.companyId === person.companyId : x.candidateId === person.id) &&
      `${x.candidateName} ${x.jobTitle}`
        .toLocaleLowerCase("pl")
        .includes(query.toLocaleLowerCase("pl")),
  );
  return (
    <>
      <PageTitle
        description={
          employer
            ? "Materiały kandydatów i kolejne kroki w Twoich procesach."
            : "Sprawdź status i wróć do materiałów, które wysłałeś."
        }
      >
        {employer ? "Kandydaci" : "Moje aplikacje"}
      </PageTitle>
      {params.has("wyslano") && (
        <Notice tone="success">
          <CheckCircle2 className="inline size-5" /> Aplikacja została wysłana.
        </Notice>
      )}
      <Field label={employer ? "Szukaj kandydata lub oferty" : "Szukaj oferty"}>
        <Input value={query} onChange={(e) => setQuery(e.target.value)} />
      </Field>
      <div className="mt-6 space-y-4">
        {applications.length ? (
          applications.map((a) => (
            <article className="prototype-panel" key={a.id}>
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <Link
                    className="work-list-title"
                    to={`${employer ? "/app/kandydaci" : "/app/aplikacje"}/${a.id}`}
                  >
                    {employer ? a.candidateName : a.jobTitle}
                  </Link>
                  <p className="my-3 text-muted-foreground">
                    {employer
                      ? a.jobTitle
                      : state.companies.find((x) => x.id === a.companyId)?.name}
                  </p>
                  <p>
                    <span className="status-tag">{stageLabels[a.stage]}</span>
                  </p>
                </div>
                <MatchScore score={a.score} />
              </div>
              {employer && <p className="mt-4 text-muted-foreground">{a.summary}</p>}
            </article>
          ))
        ) : (
          <Empty>Brak aplikacji spełniających kryteria.</Empty>
        )}
      </div>
    </>
  );
}
export function ApplicationDetail({ employer = false }: { employer?: boolean }) {
  const { id } = useParams();
  const { state } = usePrototype();
  const person = currentPerson(state)!;
  const application = state.applications.find(
    (x) =>
      x.id === id && (employer ? x.companyId === person.companyId : x.candidateId === person.id),
  );
  if (!application) return <NotFound />;
  if (employer) return <RecruitingApplication key={application.id} application={application} />;
  return <CandidateApplication key={application.id} application={application} />;
}
