import type { Criterion, CompetencyResponse } from "./competency";

export type EvidenceStatus = "described" | "partial" | "unclear";
export type CompetencyEvidence = {
  criterionId: string;
  requirement: string;
  status: EvidenceStatus;
  explanation: string;
  evidence: { label: string; quote: string }[];
  followUp: string;
};

function normalize(text: string) {
  return text.toLocaleLowerCase("pl").normalize("NFD").replace(/\p{M}/gu, "").replace(/ł/g, "l");
}
const stopWords = new Set(
  "opisz przyklad wlasny wklad realizacja realizacji zadania zadanie ktore ktora ktory ktorym swoje twoje praca pracy efekt efekty osobiscie samodzielnie jakie jakich mozesz potrafie doswiadczenie doswiadczenia zwiazany zwiazane wymaganie wymagania konkretny konkretne sprawdziles sprawdzilas zrobiles zrobilas podjales podjelas"
    .split(" ")
    .map((word) => word.slice(0, 5)),
);
function terms(text: string) {
  return [
    ...new Set(
      (normalize(text).match(/[a-z]{4,}/gu) ?? [])
        .map((word) => word.slice(0, 5))
        .filter((word) => !stopWords.has(word)),
    ),
  ];
}
// Domain synonyms make the local rehearsal tolerant of basic Polish inflections.
const topics = [
  /obslug|zglosz|klient|odpowiedz/u,
  /jakos|bled|test|weryfik|sprawdz/u,
  /wspolprac|zespol|interesariusz|wspoln/u,
  /anali|danych|metryk|raport|wniosk/u,
  /program|kod|aplikac|oprogram|backend|frontend/u,
  /wdraz|wdroz|usprawn|automat|proces|narzedz/u,
  /projekt|prototyp|interfejs/u,
  /tresc|kampani|marketing|komunikac/u,
];
const personalAction =
  /\b(?:[a-z]{3,}(?:owalam|owalem|ylam|ylem|ilam|ilem)|podjelam|podjalem|wybralam|wybralem|zrobilam|zrobilem|przyjelam|przyjalem|moim zadaniem bylo|moja odpowiedzialnosc)\b/u;
const result =
  /skrocil|zmniejszyl|zwiekszyl|spadl|wzrosl|(?:wynik|rezultat|efekt).{0,60}(?:byl|to|wyniosl|osiagn)/u;
const negated =
  /\bnie (?:wiem|znam|pamietam|mierz|sprawdz|weryfik|rob|wykon|uczestnicz|pracow|mam)/u;

/** Local evidence aid. Only submitted requirements/answers enter; never a person score or decision. */
export function analyzeCompetencyEvidence(
  criteria: readonly Criterion[],
  responses: readonly CompetencyResponse[],
): CompetencyEvidence[] {
  return criteria.map((criterion) => {
    const answer =
      responses.find((response) => response.criterionId === criterion.id)?.example.trim() ?? "";
    const sentences = answer
      .split(/\n+|(?<=[.!?])\s+/u)
      .map((part) => part.trim())
      .filter(Boolean);
    const requirement = normalize(criterion.requirement);
    const relevantTopics = topics.filter((topic) => topic.test(requirement));
    const keywords = terms(criterion.requirement + " " + (criterion.sourceExcerpt ?? ""));
    const isRelated = (sentence: string) => {
      const normalized = normalize(sentence);
      const overlap = terms(sentence).filter((term) => keywords.includes(term)).length;
      return (
        !negated.test(normalized) &&
        (overlap >= 2 || relevantTopics.some((topic) => topic.test(normalized)))
      );
    };
    const contextIndex = sentences.findIndex(isRelated);
    const context = sentences[contextIndex];
    const own = sentences.find(
      (sentence) => isRelated(sentence) && personalAction.test(normalize(sentence)),
    );
    const outcome = sentences.find(
      (sentence, index) =>
        contextIndex >= 0 &&
        Math.abs(index - contextIndex) <= 2 &&
        !negated.test(normalize(sentence)) &&
        result.test(normalize(sentence)),
    );
    const status: EvidenceStatus = context ? (own && outcome ? "described" : "partial") : "unclear";
    const evidence = [
      { label: "Związek z wymaganiem", quote: context },
      { label: "Własne działania", quote: own },
      { label: "Opis rezultatu", quote: outcome },
    ]
      .filter((item): item is { label: string; quote: string } => !!item.quote)
      .filter((item, index, all) => all.findIndex((other) => other.quote === item.quote) === index)
      .map((item) => ({ ...item, quote: item.quote.slice(0, 450) }));
    const gaps = [!own && "własne działania", !outcome && "sposób sprawdzenia rezultatu"]
      .filter(Boolean)
      .join(" i ");
    return {
      criterionId: criterion.id,
      requirement: criterion.requirement,
      status,
      explanation:
        status === "described"
          ? "Odpowiedź nawiązuje do wymagania, opisuje własne działania i rezultat. Zakres odpowiedzialności oraz podane wyniki wymagają sprawdzenia w rozmowie."
          : status === "partial"
            ? `Odpowiedź nawiązuje do wymagania. Warto doprecyzować: ${gaps}.`
            : answer
              ? "Brakuje wyraźnego powiązania przykładu z tym wymaganiem. To nie rozstrzyga, czy kandydat ma tę kompetencję."
              : "Brak odpowiedzi do tego wymagania. Nie można ocenić zgodności na podstawie przesłanego tekstu.",
      evidence: status === "unclear" ? [] : evidence,
      followUp: !context
        ? `Jaki własny przykład najlepiej pokazuje „${criterion.requirement}”? Co zrobiłeś/zrobiłaś i jaki był rezultat?`
        : !own
          ? "Za które działania i decyzje odpowiadałeś/odpowiadałaś osobiście, a co zrobił zespół?"
          : !outcome
            ? "Jak sprawdziłeś/sprawdziłaś efekt swoich działań? Jaki był punkt odniesienia i co się zmieniło?"
            : "Jakie były ograniczenia tego wyniku i za którą część rozwiązania odpowiadałeś/odpowiadałaś samodzielnie?",
    };
  });
}
