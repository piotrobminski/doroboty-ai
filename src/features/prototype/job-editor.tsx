import { useRef, useState, type FormEvent } from "react";
import { useNavigate, useParams } from "react-router";
import { FormSection } from "@/components/form-section";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { FormSelect } from "@/components/ui/form-select";
import { CompanyLogo } from "@/features/jobs/company-logo";
import { SalaryFact } from "@/features/jobs/salary-fact";
import {
  categoryLabels,
  functionLabels,
  remoteLabels,
  seniorityLabels,
  contractLabels,
} from "@/features/jobs/presentation";
import { currentPerson, jobSchema } from "./model";
import { usePrototype } from "./store";
import { Field } from "./workspace";
import { NotFound, PageTitle } from "./shell";
import { criteriaSchema } from "./competency";
import { CompetencyEditor } from "./competency-editor";
import { proposeJobSkills } from "./job-proposals";
import type { CardDraft, JobEditorDraft } from "./job-editor-state";

const steps = ["Stanowisko", "Umiejętności i pytania", "Podgląd"];

// A route/person key prevents an editor's in-memory state leaking into another offer.
export function EmployerJobEditor() {
  const { id } = useParams();
  const { state } = usePrototype();
  return <JobEditor key={`${state.activePersonId}/${id}`} />;
}
function JobEditor() {
  const { id } = useParams();
  const { state, run } = usePrototype();
  const person = currentPerson(state)!;
  const navigate = useNavigate();
  const existing = state.jobs.find((job) => job.id === id && job.companyId === person.companyId);
  const company = state.companies.find((entry) => entry.id === person.companyId)!;
  const saved = state.employerDrafts?.find(
    (draft) => draft.employerId === person.id && draft.jobId === existing?.id,
  );
  const [draft, setDraft] = useState<JobEditorDraft>(() =>
    saved
      ? {
          ...saved.value,
          step: saved.value.step === 3 ? 2 : saved.value.step,
          card: saved.value.card ? { ...saved.value.card, approved: false } : null,
        }
      : {
          title: existing?.title ?? "",
          summary: existing?.summary ?? "",
          description: existing?.description ?? "",
          category: existing?.category ?? "build",
          function: existing?.function ?? "engineering",
          remoteStatus: existing?.remoteStatus ?? "hybrid",
          seniority: existing?.seniority ?? "mid",
          contract: existing?.contract ?? "employment",
          locations: existing?.locations.join("; ") ?? "Warszawa",
          salaryMin: existing?.salaryMin?.toString() ?? "",
          salaryMax: existing?.salaryMax?.toString() ?? "",
          card: existing?.competencyCard
            ? { ...existing.competencyCard, approved: false, excludedIds: [] }
            : null,
          step: 1,
        },
  );
  const [activeSkill, setActiveSkill] = useState(0);
  const [error, setError] = useState("");
  const [invalidId, setInvalidId] = useState("");
  const [regenerate, setRegenerate] = useState(false);
  const [recovered] = useState(!!saved);
  const heading = useRef<HTMLHeadingElement>(null);
  const newId = useRef(crypto.randomUUID());
  const card = draft.card;
  const stale = !!card && card.sourceDescription !== draft.description.trim();
  const selected = card?.criteria.filter((item) => !card.excludedIds.includes(item.id)) ?? [];
  const salaryUnit = `${existing?.salaryCurrency ?? "PLN"} ${existing?.salaryKind === "net" ? "netto" : "brutto"} / ${existing?.salaryPeriod === "year" ? "rok" : "mies."}`;
  if (id !== "nowa" && !existing) return <NotFound />;
  function update(patch: Partial<JobEditorDraft>) {
    const next = { ...draft, ...patch };
    setDraft(next);
    setError("");
    setInvalidId("");
    run({ type: "job_editor_draft", jobId: existing?.id, value: next });
  }
  function move(step: JobEditorDraft["step"], patch: Partial<JobEditorDraft> = {}) {
    update({ ...patch, step });
    requestAnimationFrame(() => heading.current?.focus());
  }
  function fail(message: string, control: string, step = draft.step) {
    setDraft((value) => ({ ...value, step }));
    setError(message);
    setInvalidId(control);
    const skill = /^skill-\w+-(\d+)$/u.exec(control);
    if (skill) setActiveSkill(Number(skill[1]));
    requestAnimationFrame(() => document.getElementById(control)?.focus());
    return false;
  }
  function buildJob() {
    const jobId = existing?.id ?? newId.current;
    const locations = draft.locations
      .split(";")
      .map((place) => place.trim())
      .filter(Boolean);
    const sameLocations =
      existing && JSON.stringify(locations) === JSON.stringify(existing.locations);
    const coordinates = sameLocations
      ? existing.coordinates
      : (
          {
            warszawa: { latitude: 52.2297, longitude: 21.0122 },
            kraków: { latitude: 50.0647, longitude: 19.945 },
            wrocław: { latitude: 51.1079, longitude: 17.0385 },
            gdańsk: { latitude: 54.352, longitude: 18.6466 },
            poznań: { latitude: 52.4064, longitude: 16.9252 },
          } as Record<string, { latitude: number; longitude: number }>
        )[locations[0]?.toLocaleLowerCase("pl")];
    return jobSchema.safeParse({
      ...existing,
      id: jobId,
      slug: existing?.slug ?? `oferta-${jobId}`,
      companyId: person.companyId,
      title: draft.title,
      summary: draft.summary.trim() || draft.description.trim().slice(0, 180),
      description: draft.description,
      sourceBrief: existing?.sourceBrief,
      generatedDescription: existing?.generatedDescription,
      generatedDescriptionModel: existing?.generatedDescriptionModel,
      category: draft.category,
      function: draft.function,
      remoteStatus: draft.remoteStatus,
      seniority: draft.seniority,
      contract: draft.contract,
      locations,
      coordinates,
      salaryMin: draft.salaryMin === "" ? undefined : Number(draft.salaryMin),
      salaryMax: draft.salaryMax === "" ? undefined : Number(draft.salaryMax),
      salaryCurrency: existing?.salaryCurrency ?? "PLN",
      salaryPeriod: existing?.salaryPeriod ?? "month",
      salaryKind: existing?.salaryKind ?? "gross",
      competencyCard: undefined,
      publicationStatus: "published",
      publishedAt: existing?.publishedAt ?? new Date().toISOString(),
      expiryAt: existing?.expiryAt ?? "2099-12-31T23:59:59.000Z",
      verificationStatus: "employer_verified",
    });
  }
  function validateDetails() {
    // The same domain schema validates step one and final publication.
    const parsed = buildJob();
    if (parsed.success) return parsed.data;
    const field = String(parsed.error.issues[0]?.path[0] ?? "title");
    const labels: Record<string, string> = {
      title: "Podaj nazwę stanowiska (1–200 znaków).",
      summary: "Podsumowanie powinno mieć co najmniej 10 znaków.",
      description: "Opisz stanowisko w co najmniej 30 znakach.",
      locations: "Podaj od 1 do 10 lokalizacji, każdą do 200 znaków. Rozdziel je średnikiem.",
      salaryMin: "Podaj poprawną dolną kwotę wynagrodzenia (minimum 0).",
      salaryMax: "Górna kwota wynagrodzenia musi być większa lub równa dolnej.",
    };
    fail(labels[field] ?? "Sprawdź warunki oferty.", `job-${field}`, 1);
    return null;
  }
  function prepare(): CardDraft {
    const criteria = proposeJobSkills(draft.description);
    return {
      sourceDescription: draft.description.trim(),
      proposedCriteria: criteria,
      criteria,
      excludedIds: [],
      mode: "local-template",
      approved: false,
    };
  }
  function nextToQuestions() {
    if (!validateDetails()) return;
    setActiveSkill(0);
    move(2, { card: card ?? prepare() });
  }
  function validateQuestions() {
    if (stale)
      return fail(
        "Opis zmienił się. Wybierz nowe propozycje albo zachowaj i sprawdź swoje pytania dla aktualnego opisu.",
        "keep-questions",
        2,
      );
    if (selected.length && !criteriaSchema.safeParse(selected).success) {
      const index = card!.criteria.findIndex(
        (item) =>
          !card!.excludedIds.includes(item.id) &&
          (item.requirement.trim().length < 10 || item.question.trim().length < 10),
      );
      const field =
        card!.criteria[index].requirement.trim().length < 10 ? "requirement" : "question";
      return fail(
        "Uzupełnij wybraną umiejętność i pytanie (10–1000 znaków) albo pomiń tę umiejętność.",
        `skill-${field}-${index}`,
        2,
      );
    }
    if (!card) return fail("Przygotuj pytania przed przejściem do podglądu.", "skills-heading", 2);
    return true;
  }
  function openPreview() {
    if (validateDetails() && validateQuestions() && card) {
      // The explicit transition is the recruiter's review confirmation.
      move(3, { card: { ...card, approved: true } });
    }
  }
  async function submit(event: FormEvent) {
    event.preventDefault();
    if (draft.step === 1) {
      nextToQuestions();
      return;
    }
    if (draft.step === 2) {
      openPreview();
      return;
    }
    const job = validateDetails();
    if (!job || !validateQuestions()) return;
    if (!card?.approved) {
      fail("Sprawdź aktualne pytania i przejdź do podglądu przed publikacją.", "skills-heading", 2);
      return;
    }
    const parsed = jobSchema.safeParse({
      ...job,
      competencyCard: selected.length
        ? {
            ...card,
            criteria: selected,
            approvedBy: person.id,
            approvedAt: new Date().toISOString(),
          }
        : undefined,
    });
    if (!parsed.success) {
      fail("Sprawdź pytania dla aktualnego opisu.", "skills-heading", 2);
      return;
    }
    if (await run({ type: "publish", job: parsed.data })) navigate("/app/oferty");
  }
  const invalid = (name: string) => ({
    "aria-invalid": invalidId === `job-${name}` || undefined,
    "aria-describedby": invalidId === `job-${name}` ? "job-editor-error" : undefined,
  });
  const preview = buildJob();
  return (
    <div className="job-wizard">
      <PageTitle
        eyebrow="Dla pracodawców / Oferta"
        description="Najpierw opisz stanowisko. Potem wspólnie dobierzemy pytania do kandydatów."
      >
        {existing ? "Edytuj ofertę" : "Nowa oferta"}
      </PageTitle>
      <nav aria-label="Etapy tworzenia oferty" className="job-steps">
        {steps.map((label, index) => (
          <Button
            key={label}
            type="button"
            variant="outline"
            aria-current={draft.step === index + 1 ? "step" : undefined}
            onClick={() => {
              if (index === 0) move(1);
              if (index === 1) nextToQuestions();
              if (index === 2) {
                if (!card) nextToQuestions();
                else openPreview();
              }
            }}
          >
            <span className="job-step-number">{index + 1}</span>
            {label}
          </Button>
        ))}
      </nav>
      {recovered && (
        <p className="application-help job-recovered">
          Przywrócono zapisany formularz. Przed publikacją sprawdź treść w podglądzie.
        </p>
      )}
      <h2 className="sr-only" tabIndex={-1} ref={heading}>
        {steps[draft.step - 1]}
      </h2>
      <form className="job-wizard-form" onSubmit={submit} noValidate>
        {draft.step === 1 && (
          <>
            <FormSection
              index="01"
              eyebrow="Opis stanowiska"
              title="Jaką pracę będzie wykonywać ta osoba?"
              description="Opisz zadania i oczekiwany efekt. Nie musisz znać nazw umiejętności ani przygotowywać pytań."
            >
              <Field label="Nazwa stanowiska">
                <Input
                  id="job-title"
                  name="title"
                  required
                  maxLength={200}
                  value={draft.title}
                  {...invalid("title")}
                  onChange={(e) => update({ title: e.target.value })}
                />
              </Field>
              <Field label="Ogólny opis stanowiska">
                <Textarea
                  id="job-description"
                  name="description"
                  required
                  minLength={30}
                  rows={8}
                  maxLength={12000}
                  value={draft.description}
                  {...invalid("description")}
                  onChange={(e) =>
                    update({
                      description: e.target.value,
                      card: card ? { ...card, approved: false } : null,
                    })
                  }
                />
              </Field>
              <p className="application-help">
                Co ta osoba będzie robić na co dzień? Co ma się zmienić dzięki jej pracy?
              </p>
              <Field label="Krótkie podsumowanie (opcjonalnie)">
                <Textarea
                  id="job-summary"
                  name="summary"
                  maxLength={12000}
                  value={draft.summary}
                  {...invalid("summary")}
                  onChange={(e) => update({ summary: e.target.value })}
                />
              </Field>
              <p className="application-help">
                Jeśli zostawisz to pole puste, na liście ofert pokażemy początek opisu.
              </p>
            </FormSection>
            <FormSection
              index="02"
              eyebrow="Warunki"
              title="Warunki współpracy"
              description="Obszar pracy i doświadczenie to osobne informacje. Podaj warunki roli."
            >
              <div className="grid gap-4 sm:grid-cols-2">
                {(
                  [
                    ["category", "Kategoria", categoryLabels],
                    ["function", "Funkcja", functionLabels],
                    ["remoteStatus", "Tryb pracy", remoteLabels],
                    ["seniority", "Poziom", seniorityLabels],
                    ["contract", "Umowa", contractLabels],
                  ] as const
                ).map(([name, label, labels]) => (
                  <Field key={name} label={label}>
                    <FormSelect
                      value={draft[name]}
                      name={name}
                      ariaLabel={label}
                      options={Object.entries(labels).map(([value, label]) => ({ value, label }))}
                      onValueChange={(value) => update({ [name]: value })}
                    />
                  </Field>
                ))}
                <Field label="Lokalizacja">
                  <Input
                    id="job-locations"
                    name="location"
                    required
                    value={draft.locations}
                    maxLength={2000}
                    {...invalid("locations")}
                    onChange={(e) => update({ locations: e.target.value })}
                  />
                </Field>
                <Field label={`Wynagrodzenie od (${salaryUnit})`}>
                  <Input
                    id="job-salaryMin"
                    name="salaryMin"
                    type="number"
                    min="0"
                    maxLength={30}
                    value={draft.salaryMin}
                    {...invalid("salaryMin")}
                    onChange={(e) => update({ salaryMin: e.target.value })}
                  />
                </Field>
                <Field label={`Wynagrodzenie do (${salaryUnit})`}>
                  <Input
                    id="job-salaryMax"
                    name="salaryMax"
                    type="number"
                    min="0"
                    maxLength={30}
                    value={draft.salaryMax}
                    {...invalid("salaryMax")}
                    onChange={(e) => update({ salaryMax: e.target.value })}
                  />
                </Field>
              </div>
              <p className="application-help">
                Kilka lokalizacji rozdziel średnikiem. Brak kwot oznacza, że widełki nie zostały
                podane.
              </p>
            </FormSection>
          </>
        )}
        {draft.step === 2 && card && (
          <>
            <section
              className="prototype-panel job-description-summary"
              aria-labelledby="source-heading"
            >
              <div className="job-wizard-actions">
                <p className="eyebrow">Twój opis stanowiska</p>
                <Button type="button" variant="link" onClick={() => move(1)}>
                  Edytuj opis
                </Button>
              </div>
              <h3 id="source-heading">{draft.title}</h3>
              <p>{draft.description}</p>
            </section>
            {stale && (
              <section className="prototype-panel job-stale" aria-label="Zmieniony opis">
                <p>
                  Opis stanowiska zmienił się. Twoje dotychczasowe poprawki są zachowane. Wybierz, z
                  którymi pytaniami chcesz pracować dalej.
                </p>
                <div className="workspace-actions">
                  <Button type="button" variant="outline" onClick={() => setRegenerate(true)}>
                    Przygotuj propozycje dla nowego opisu
                  </Button>
                  <Button
                    id="keep-questions"
                    type="button"
                    variant="outline"
                    onClick={() =>
                      update({
                        card: {
                          ...card,
                          approved: false,
                          sourceDescription: draft.description.trim(),
                          proposedCriteria: card.proposedCriteria.map(
                            ({ id, requirement, question }) => ({ id, requirement, question }),
                          ),
                          criteria: card.criteria.map(({ id, requirement, question }) => ({
                            id,
                            requirement,
                            question,
                          })),
                        },
                      })
                    }
                  >
                    Zachowaj moje pytania dla nowego opisu
                  </Button>
                </div>
              </section>
            )}
            <CompetencyEditor
              value={card}
              active={activeSkill}
              onActiveChange={setActiveSkill}
              invalidId={invalidId}
              onChange={(value) => update({ card: value })}
            />
            <div className="job-review">
              <p className="application-help">
                {selected.length
                  ? `Wybrane pytania: ${selected.length}.`
                  : "Oferta bez dodatkowych pytań — kandydat napisze jedną ogólną odpowiedź."}
              </p>
            </div>
          </>
        )}
        {draft.step === 3 && preview.success && (
          <>
            <section className="prototype-panel job-preview" aria-labelledby="preview-heading">
              <p className="eyebrow">Podgląd oferty i formularza kandydata</p>
              <h2 id="preview-heading">Tak zobaczy ofertę kandydat</h2>
              <CompanyLogo company={company} />
              <p className="application-help">{company.name}</p>
              <h3 className="job-preview-title">{preview.data.title}</h3>
              <p>{preview.data.summary}</p>
              <dl className="job-preview-terms">
                {[
                  ["Kategoria", categoryLabels[draft.category]],
                  ["Funkcja", functionLabels[draft.function]],
                  ["Tryb pracy", remoteLabels[draft.remoteStatus]],
                  ["Poziom", seniorityLabels[draft.seniority]],
                  ["Umowa", contractLabels[draft.contract]],
                  ["Lokalizacja", preview.data.locations.join(" / ")],
                ].map(([label, value]) => (
                  <div key={label}>
                    <dt>{label}</dt>
                    <dd>{value}</dd>
                  </div>
                ))}
                <div>
                  <dt>Wynagrodzenie</dt>
                  <dd>
                    <SalaryFact job={preview.data} />
                  </dd>
                </div>
              </dl>
              <h3>Opis stanowiska</h3>
              <p>{preview.data.description}</p>
              <h3>Pytania o Twój wkład</h3>
              {selected.length ? (
                <>
                  <p className="application-help">
                    Do każdego pytania kandydat doda własny przykład i opcjonalne materiały.
                  </p>
                  {selected.map((item, index) => (
                    <section key={item.id} className="job-preview-question">
                      <h4>
                        {index + 1}. {item.requirement}
                      </h4>
                      <p>{item.question}</p>
                    </section>
                  ))}
                </>
              ) : (
                <p>Oferta bez dodatkowych pytań. Kandydat napisze jedną ogólną odpowiedź.</p>
              )}
            </section>
          </>
        )}
        {error && (
          <p id="job-editor-error" role="alert" className="error-message">
            {error}
          </p>
        )}
        <div className="job-wizard-actions">
          {draft.step > 1 ? (
            <Button type="button" variant="outline" onClick={() => move(draft.step === 3 ? 2 : 1)}>
              ← Wróć do edycji
            </Button>
          ) : (
            <p className="application-help">Twoje zmiany zapisują się w tej przeglądarce.</p>
          )}
          <Button type="submit">
            {draft.step === 1
              ? "Dalej: umiejętności i pytania →"
              : draft.step === 2
                ? "Przejdź do podglądu →"
                : "Opublikuj ofertę"}
          </Button>
        </div>
      </form>
      <ConfirmDialog
        open={regenerate}
        onOpenChange={setRegenerate}
        title="Przygotować nowe pytania?"
        description="Nowe propozycje zastąpią dotychczasowe pytania i poprawki w tym formularzu. Zapisane aplikacje kandydatów zachowają swoją wersję pytań."
        label="Przygotuj nowe propozycje"
        pending={false}
        onConfirm={() => {
          update({ card: prepare() });
          setActiveSkill(0);
          setRegenerate(false);
          requestAnimationFrame(() => document.getElementById("skill-name")?.focus());
        }}
      />
    </div>
  );
}
