import { Textarea } from "@/components/ui/textarea";
import { Field } from "./workspace";
import type { CompetencyCard, CompetencyResponse } from "./competency";

export function CompetencyResponses({
  card,
  responses,
  onChange,
  attempted,
  disabled,
}: {
  card: CompetencyCard;
  responses: CompetencyResponse[];
  onChange: (responses: CompetencyResponse[]) => void;
  attempted: boolean;
  disabled: boolean;
}) {
  const previous = responses.filter(
    (response) => !card.criteria.some((criterion) => criterion.id === response.criterionId),
  );
  function update(id: string, field: "example" | "materials", value: string) {
    const response = responses.find((item) => item.criterionId === id) ?? {
      criterionId: id,
      example: "",
      materials: "",
    };
    onChange([
      ...responses.filter((item) => item.criterionId !== id),
      { ...response, [field]: value },
    ]);
  }
  return (
    <section
      className="application-form-section competency-editor"
      aria-labelledby="competency-responses-title"
    >
      <h3 id="competency-responses-title">Twoje przykłady i własny wkład</h3>
      <p className="application-help">
        Odpowiedz na kryteria zatwierdzone przez rekrutera. Opisz własne działania, decyzje i
        rezultaty. Używaj wyłącznie danych syntetycznych.
      </p>
      {card.criteria.map((criterion, index) => {
        const response = responses.find((item) => item.criterionId === criterion.id);
        const invalid = attempted && (response?.example.trim().length ?? 0) < 20;
        return (
          <fieldset key={criterion.id} className="competency-item">
            <legend>Kryterium {index + 1}</legend>
            <p className="competency-requirement">{criterion.requirement}</p>
            <p id={`question-${criterion.id}`}>{criterion.question}</p>
            <Field label={`Twój przykład i własny wkład ${index + 1}`}>
              <Textarea
                id={`example-${criterion.id}`}
                required
                minLength={20}
                maxLength={12000}
                disabled={disabled}
                value={response?.example ?? ""}
                aria-invalid={invalid || undefined}
                aria-describedby={`question-${criterion.id} example-help-${criterion.id}`}
                onChange={(e) => update(criterion.id, "example", e.target.value)}
              />
            </Field>
            <p
              id={`example-help-${criterion.id}`}
              className={invalid ? "error-message" : "application-help"}
              role={invalid ? "alert" : undefined}
            >
              {invalid
                ? "Opisz własny wkład — minimum 20 znaków."
                : "Minimum 20 znaków. Oddziel swój wkład od pracy zespołu."}
            </p>
            <Field label={`Materiały ${index + 1} (opcjonalnie)`}>
              <Textarea
                maxLength={2000}
                rows={2}
                disabled={disabled}
                value={response?.materials ?? ""}
                aria-describedby="competency-materials-help"
                onChange={(e) => update(criterion.id, "materials", e.target.value)}
              />
            </Field>
          </fieldset>
        );
      })}
      <p id="competency-materials-help" className="application-help">
        Wklej linki do przykładowych materiałów lub je opisz. Pliki nie są przesyłane. Materiały są
        opcjonalne — możesz opisać rezultat bez udostępniania dokumentów.
      </p>
      <SavedCompetencyExamples responses={previous} />
    </section>
  );
}

export function SavedCompetencyExamples({
  responses,
  cardRemoved = false,
}: {
  responses: CompetencyResponse[];
  cardRemoved?: boolean;
}) {
  if (!responses.length) return null;
  return (
    <details className="competency-item">
      <summary>Przykłady z poprzedniej wersji karty ({responses.length})</summary>
      <p className="application-help">
        {cardRemoved
          ? "Karta została usunięta z oferty. Te treści pozostają w szkicu; możesz skopiować je do swojej odpowiedzi poniżej."
          : "Kryteria zmieniły się. Te treści pozostają w szkicu; do aplikacji trafią odpowiedzi na aktualne kryteria powyżej."}
      </p>
      {responses.map((response) => (
        <div key={response.criterionId}>
          <p className="whitespace-pre-wrap">{response.example}</p>
          <p className="whitespace-pre-wrap">{response.materials}</p>
        </div>
      ))}
    </details>
  );
}

export function CompetencyComparison({
  competency,
}: {
  competency: { card: CompetencyCard; responses: CompetencyResponse[] };
}) {
  return (
    <div className="competency-editor">
      <h3>Karta kompetencji z momentu aplikowania</h3>
      {competency.card.criteria.map((criterion, index) => {
        const response = competency.responses.find((item) => item.criterionId === criterion.id)!;
        return (
          <section
            key={criterion.id}
            className="competency-comparison"
            aria-label={`Kryterium ${index + 1}`}
          >
            <div>
              <h4>Wymaganie {index + 1}</h4>
              <p className="competency-requirement">{criterion.requirement}</p>
              <p>{criterion.question}</p>
            </div>
            <div>
              <h4>Przykład i własny wkład</h4>
              <p>{response.example}</p>
              <h4>Materiały</h4>
              {response.materials ? (
                <MaterialText text={response.materials} />
              ) : (
                <p className="record-caption">Nie dodano materiałów.</p>
              )}
            </div>
          </section>
        );
      })}
    </div>
  );
}

function MaterialText({ text }: { text: string }) {
  return (
    <div>
      {text.split("\n").map((line, index) => {
        let url: URL | undefined;
        try {
          url = new URL(line.trim());
        } catch {
          /* Descriptions remain plain text. */
        }
        return (
          <p key={index}>
            {url && ["https:", "http:"].includes(url.protocol) && !url.username && !url.password ? (
              <a
                className="text-[var(--gui-link)] underline"
                href={url.href}
                target="_blank"
                rel="noreferrer"
              >
                {line}
              </a>
            ) : (
              line
            )}
          </p>
        );
      })}
    </div>
  );
}
