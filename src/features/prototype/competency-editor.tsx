import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Field } from "./workspace";
import type { CardDraft } from "./job-editor-state";

export function CompetencyEditor({
  value,
  onChange,
  invalidId,
  active,
  onActiveChange,
}: {
  value: CardDraft;
  onChange: (value: CardDraft) => void;
  invalidId: string;
  active: number;
  onActiveChange: (index: number) => void;
}) {
  const index = Math.min(active, value.criteria.length - 1);
  const criterion = value.criteria[index];
  const selected = !value.excludedIds.includes(criterion.id);
  function edit(patch: Partial<typeof criterion>) {
    onChange({
      ...value,
      approved: false,
      criteria: value.criteria.map((item) =>
        item.id === criterion.id ? { ...item, ...patch } : item,
      ),
    });
  }
  function show(next: number) {
    onActiveChange(next);
    requestAnimationFrame(() => document.getElementById("skill-name")?.focus());
  }
  return (
    <section className="prototype-panel competency-editor" aria-labelledby="skills-heading">
      <header>
        <p className="eyebrow">Propozycje z opisu stanowiska</p>
        <h2 id="skills-heading" tabIndex={-1}>
          Jakie doświadczenie chcesz poznać?
        </h2>
        <p className="application-help">
          Nie musisz wymyślać pytań. Sprawdź po kolei, czy te propozycje pasują do pracy, którą
          opisujesz.
        </p>
      </header>
      <div className="job-skill-nav" aria-label="Proponowane umiejętności">
        {value.criteria.map((item, position) => (
          <Button
            key={item.id}
            type="button"
            variant="outline"
            aria-pressed={position === index}
            onClick={() => show(position)}
          >
            {position + 1}. {item.requirement || "Nowa umiejętność"}
            {value.excludedIds.includes(item.id) ? " · pominięta" : ""}
          </Button>
        ))}
      </div>
      {/* Keep every edited skill mounted so validation can focus any invalid field. */}
      {value.criteria.map((item, position) => (
        <div key={item.id} hidden={position !== index} className="job-skill-detail">
          <span className="job-skill-tag">Proponowana umiejętność</span>
          <h3 id={position === index ? "skill-name" : undefined} tabIndex={-1}>
            {item.requirement || "Nowa umiejętność"}
          </h3>
          {item.sourceExcerpt && (
            <p className="application-help">
              <strong>Z Twojego opisu:</strong> „{item.sourceExcerpt}” {item.explanation}
            </p>
          )}
          <label className="checkbox-field">
            <Checkbox
              checked={!value.excludedIds.includes(item.id)}
              aria-labelledby={`select-skill-label-${position}`}
              onCheckedChange={(checked) =>
                onChange({
                  ...value,
                  approved: false,
                  excludedIds: checked
                    ? value.excludedIds.filter((id) => id !== item.id)
                    : [...value.excludedIds, item.id],
                })
              }
            />
            <span id={`select-skill-label-${position}`}>
              Chcę zapytać kandydatów o tę umiejętność.
            </span>
          </label>
          <Field label={`Umiejętność do sprawdzenia ${position + 1}`}>
            <Textarea
              id={`skill-requirement-${position}`}
              maxLength={1000}
              value={item.requirement}
              aria-invalid={invalidId === `skill-requirement-${position}` || undefined}
              aria-describedby={
                invalidId === `skill-requirement-${position}` ? "job-editor-error" : undefined
              }
              onChange={(e) => edit({ requirement: e.target.value })}
            />
          </Field>
          <Field label={`Pytanie o własny wkład ${position + 1}`}>
            <Textarea
              id={`skill-question-${position}`}
              maxLength={1000}
              value={item.question}
              aria-invalid={invalidId === `skill-question-${position}` || undefined}
              aria-describedby={
                invalidId === `skill-question-${position}`
                  ? "job-editor-error"
                  : `skill-help-${position}`
              }
              onChange={(e) => edit({ question: e.target.value })}
            />
          </Field>
          <p id={`skill-help-${position}`} className="application-help">
            Możesz zmienić treść pytania, tak aby pasowało do Twojej firmy.
            {!selected && " Pominięte pytanie nie trafi do formularza kandydata."}
          </p>
          {value.criteria.length > 1 && (
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                const criteria = value.criteria.filter((entry) => entry.id !== item.id);
                onChange({
                  ...value,
                  criteria,
                  excludedIds: value.excludedIds.filter((id) => id !== item.id),
                  approved: false,
                });
                show(Math.min(position, criteria.length - 1));
              }}
            >
              Usuń umiejętność {position + 1}
            </Button>
          )}
        </div>
      ))}
      <div className="job-wizard-actions">
        <p className="application-help">
          Umiejętność {index + 1} z {value.criteria.length}
        </p>
        {index < value.criteria.length - 1 && (
          <Button type="button" variant="outline" onClick={() => show(index + 1)}>
            Następna umiejętność →
          </Button>
        )}
      </div>
      <div className="workspace-actions">
        <Button
          type="button"
          variant="outline"
          disabled={value.criteria.length >= 6}
          onClick={() => {
            onChange({
              ...value,
              approved: false,
              criteria: [
                ...value.criteria,
                { id: crypto.randomUUID(), requirement: "", question: "" },
              ],
            });
            onActiveChange(value.criteria.length);
            requestAnimationFrame(() =>
              document.getElementById(`skill-requirement-${value.criteria.length}`)?.focus(),
            );
          }}
        >
          Dodaj umiejętność (maks. 6)
        </Button>
        <Button
          type="button"
          variant="ghost"
          onClick={() =>
            onChange({
              ...value,
              excludedIds: value.criteria.map((item) => item.id),
              approved: false,
            })
          }
        >
          Zrezygnuj z dodatkowych pytań
        </Button>
      </div>
      <p className="application-help">
        Kandydat opisze własne działania i rezultaty. Materiały dołączy do swojej odpowiedzi.
      </p>
    </section>
  );
}
