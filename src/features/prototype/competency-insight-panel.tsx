import { useId } from "react";
import type { CompetencyCard, CompetencyResponse } from "./competency";
import { analyzeCompetencyEvidence } from "./competency-insight";

const labels = {
  described: "Konkretny przykład",
  partial: "Do doprecyzowania",
  unclear: "Brak powiązanego przykładu",
};
export function CompetencyInsightPanel({
  competency,
}: {
  competency: { card: CompetencyCard; responses: CompetencyResponse[] };
}) {
  const id = useId();
  const insights = analyzeCompetencyEvidence(competency.card.criteria, competency.responses);
  const described = insights.filter((item) => item.status === "described").length;
  return (
    <section className="competency-insight" aria-labelledby={id}>
      <header>
        <p className="eyebrow">Podpowiedź AI</p>
        <h3 id={id}>Zgodność odpowiedzi z wymaganiami</h3>
        <p className="competency-insight-summary">
          {described} z {insights.length} odpowiedzi opisują powiązany przykład, własne działania i
          rezultat.
        </p>
        <p className="record-caption">
          Sprawdź wskazane fragmenty i pytania uzupełniające. To wstępna analiza opisu, nie
          potwierdzenie kompetencji. Decyzję i jej uzasadnienie zapisujesz samodzielnie.
        </p>
      </header>
      <ol className="competency-insight-list">
        {insights.map((item, index) => (
          <li key={item.criterionId}>
            <div className="competency-insight-heading">
              <h4>
                {index + 1}. {item.requirement}
              </h4>
              <span className="competency-evidence-status" data-evidence-status={item.status}>
                {labels[item.status]}
              </span>
            </div>
            <p>{item.explanation}</p>
            {item.evidence.length > 0 && (
              <details>
                <summary>Fragmenty odpowiedzi ({item.evidence.length})</summary>
                {item.evidence.map((evidence) => (
                  <blockquote key={evidence.label}>
                    <p className="record-caption">{evidence.label}</p>
                    <p>„{evidence.quote}”</p>
                  </blockquote>
                ))}
              </details>
            )}
            <p className="competency-follow-up">
              <strong>Dopytaj:</strong> {item.followUp}
            </p>
          </li>
        ))}
      </ol>
      <p className="record-caption">
        Analiza dotyczy wymagań i odpowiedzi zapisanych w tej aplikacji. CV i materiały pod linkami
        nie są analizowane.
      </p>
    </section>
  );
}
