import { useLayoutEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ApplicationRecord } from "./application-record";
import { nextStages, stageLabels, type Application } from "./model";
import { usePrototype } from "./store";
import { decisionReasonSchema } from "./competency";
import { CompetencyInsightPanel } from "./competency-insight-panel";

export function RecruitingApplication({
  application,
  archived,
}: {
  application: Application;
  archived: boolean;
}) {
  const { state, run, pending } = usePrototype();
  const [note, setNote] = useState("");
  const [error, setError] = useState("");
  const noteRef = useRef<HTMLTextAreaElement>(null);
  const [announcement, setAnnouncement] = useState("");
  const statusRef = useRef<HTMLSpanElement>(null);
  const pendingFocus = useRef(false);
  const company = state.companies.find((item) => item.id === application.companyId);
  const availableStages = archived ? [] : nextStages[application.stage];

  useLayoutEffect(() => {
    if (pendingFocus.current) {
      statusRef.current?.focus();
      pendingFocus.current = false;
    }
  }, [application.stage]);

  return (
    <>
      <ApplicationRecord
        application={application}
        companyName={company?.name ?? ""}
        audience="employer"
        archived={archived}
        history={application.events}
        statusRef={statusRef}
        answerSupport={
          application.competency ? (
            <CompetencyInsightPanel competency={application.competency} />
          ) : undefined
        }
        footer={
          archived ? (
            <p className="record-caption">Aplikacja jest dostępna w archiwum do odczytu.</p>
          ) : availableStages.length > 0 ? (
            <>
              <p className="record-caption">
                {application.competency
                  ? "Uzasadnienie jest wymagane (minimum 20 znaków) i zapisze się w historii po zmianie etapu."
                  : "Notatka zapisze się w historii po zmianie etapu."}
              </p>
              <div className="record-actions">
                {availableStages.map((stage) => (
                  <Button
                    disabled={pending}
                    key={stage}
                    variant={stage === "rejected" ? "outline" : "default"}
                    onClick={async () => {
                      if (application.competency && !decisionReasonSchema.safeParse(note).success) {
                        setError(
                          "Uzasadnij następny krok, odnosząc się do wymagań i odpowiedzi (minimum 20 znaków).",
                        );
                        noteRef.current?.focus();
                        return;
                      }
                      if (
                        await run({ type: "stage", applicationId: application.id, stage, note })
                      ) {
                        setNote("");
                        setAnnouncement(`Zapisano etap: ${stageLabels[stage]}.`);
                        pendingFocus.current = true;
                      }
                    }}
                  >
                    {stageLabels[stage]}
                  </Button>
                ))}
              </div>
            </>
          ) : (
            <p className="record-caption">
              {stageLabels[application.stage]}. Brak kolejnych działań w tym procesie.
            </p>
          )
        }
      >
        {availableStages.length > 0 ? (
          <>
            <h3>
              <label htmlFor="recruiting-note">
                {application.competency ? "Uzasadnienie następnego kroku" : "Notatka rekrutacyjna"}
              </label>
            </h3>
            <p className="record-caption" id="recruiting-note-hint">
              Widoczna tylko pracodawcy w tym scenariuszu.
            </p>
            <Textarea
              id="recruiting-note"
              ref={noteRef}
              aria-label={
                application.competency
                  ? "Uzasadnienie następnego kroku"
                  : "Notatka rekrutacyjna (widoczna pracodawcy)"
              }
              aria-invalid={!!error || undefined}
              aria-describedby={
                error ? "recruiting-note-hint recruiting-note-error" : "recruiting-note-hint"
              }
              maxLength={12000}
              rows={4}
              value={note}
              onChange={(event) => {
                setNote(event.target.value);
                setError("");
              }}
              placeholder="Co warto sprawdzić w rozmowie?"
            />
            {error && (
              <p id="recruiting-note-error" role="alert" className="error-message">
                {error}
              </p>
            )}
          </>
        ) : null}
      </ApplicationRecord>
      <p role="status" className="sr-only">
        {announcement}
      </p>
    </>
  );
}
