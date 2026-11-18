import { uuid } from "../../lib/uuid";
import { z } from "zod";
import type { Criterion } from "./competency";

// A bounded, deterministic rehearsal of proposal generation. Never an assessment.
const patterns = [
  {
    match: /obsług|zgłosze|czas\w* odpowiedzi/iu,
    requirement: "Usprawnianie obsługi klienta",
    explanation: "Poznasz, jak kandydat rozpoznaje problem i wprowadza zmianę.",
    question:
      "Opisz usprawnienie obsługi klienta, które wprowadziłeś/wprowadziłaś. Co zmieniłeś/zmieniłaś osobiście i po czym poznałeś/poznałaś, że działa?",
  },
  {
    match: /jakoś|błęd|test|weryfik|sprawdz/iu,
    requirement: "Sprawdzanie jakości rezultatów",
    explanation: "Poznasz sposób sprawdzania wyniku i reagowania na wykryte problemy.",
    question:
      "Opisz sytuację, w której sprawdzałeś/sprawdzałaś jakość rezultatu. Jak osobiście wykryłeś/wykryłaś problem, co poprawiłeś/poprawiłaś i jak sprawdziłeś/sprawdziłaś efekt?",
  },
  {
    match: /współprac|zespo[łl]|interesariusz|wyjaśnia/iu,
    requirement: "Współpraca przy realizacji zadań",
    explanation: "Poznasz własną odpowiedzialność kandydata na tle działań zespołu.",
    question:
      "Opisz zadanie realizowane wspólnie z innymi osobami. Za co odpowiadałeś/odpowiadałaś osobiście, jakie decyzje podjąłeś/podjęłaś i jak pomogłeś/pomogłaś zespołowi osiągnąć rezultat?",
  },
  {
    match: /anali|danych|metryk|raport/iu,
    requirement: "Wyciąganie wniosków z danych",
    explanation: "Poznasz drogę od samodzielnej analizy do decyzji i jej ograniczenia.",
    question:
      "Opisz analizę, którą samodzielnie wykonałeś/wykonałaś. Jak dobrałeś/dobrałaś dane, do jakiego wniosku doszedłeś/doszłaś i jak wpłynął on na decyzję? Jakie były ograniczenia?",
  },
  {
    match: /badani|potrzeb|użytkown|wywiad/iu,
    requirement: "Rozpoznawanie potrzeb użytkowników",
    explanation: "Poznasz, jak kandydat samodzielnie zdobywa wiedzę o potrzebach.",
    question:
      "Opisz, jak rozpoznałeś/rozpoznałaś potrzebę użytkowników. Co zrobiłeś/zrobiłaś osobiście, czego się dowiedziałeś/dowiedziałaś i jak wpłynęło to na dalszą pracę?",
  },
  {
    match: /program|kod|aplikac|oprogram|api\b|backend|frontend/iu,
    requirement: "Tworzenie rozwiązań programistycznych",
    explanation: "Poznasz własne decyzje techniczne i sprawdzanie działania rozwiązania.",
    question:
      "Opisz rozwiązanie programistyczne, które współtworzyłeś/współtworzyłaś. Którą część wykonałeś/wykonałaś osobiście, dlaczego wybrałeś/wybrałaś to podejście i jak sprawdziłeś/sprawdziłaś działanie?",
  },
  {
    match: /automat|usprawn|wdra|proces|narzędz/iu,
    requirement: "Wdrażanie usprawnień w pracy",
    explanation: "Poznasz własny wkład w zmianę sposobu pracy i ocenę jej efektów.",
    question:
      "Opisz usprawnienie procesu lub narzędzie, które wdrażałeś/wdrażałaś. Co zrobiłeś/zrobiłaś samodzielnie, jaki problem rozwiązywało i jak sprawdziłeś/sprawdziłaś rezultat?",
  },
  {
    match: /projekt|prototyp|interfejs/iu,
    requirement: "Projektowanie rozwiązań dla odbiorców",
    explanation: "Poznasz własne decyzje projektowe i sposób sprawdzania pomysłu.",
    question:
      "Opisz rozwiązanie, które zaprojektowałeś/zaprojektowałaś. Jakie decyzje należały do Ciebie, jak sprawdziłeś/sprawdziłaś pomysł i co zmieniłeś/zmieniłaś po zebraniu informacji?",
  },
  {
    match: /treś|kampani|marketing|komunikac|pisan/iu,
    requirement: "Przygotowywanie skutecznej komunikacji",
    explanation: "Poznasz samodzielne decyzje dotyczące treści i sprawdzanie ich efektu.",
    question:
      "Opisz materiał lub działanie komunikacyjne, które przygotowałeś/przygotowałaś. Co było Twoim własnym wkładem, jak dobrałeś/dobrałaś przekaz do odbiorców i jak sprawdziłeś/sprawdziłaś efekt?",
  },
];

export function proposeJobSkills(description: string): Criterion[] {
  const source = z.string().trim().min(30).max(12000).parse(description);
  const fragments = source
    .split(/\n+|(?<=[.!?])\s+/u)
    .map((part) => part.trim())
    .filter(Boolean);
  const proposals: Criterion[] = patterns
    .flatMap(({ match, ...proposal }) => {
      const fragment = fragments.find(
        (part) =>
          match.test(part) &&
          !/nie (?:wymagamy|wymaga|potrzeba|trzeba)|bez (?:konieczności|potrzeby)/iu.test(part) &&
          !/^(?:oferujemy|zapewniamy|benefity)\b/iu.test(part),
      );
      if (!fragment) return [];
      const position = fragment.search(match);
      // Keep the matching phrase inside the exact source excerpt, even in very long lines.
      const start = Math.max(0, position - 150);
      return [{ id: uuid(), ...proposal, sourceExcerpt: fragment.slice(start, start + 500) }];
    })
    .slice(0, 3);
  if (proposals.length) return proposals;
  return [
    {
      id: uuid(),
      requirement: "Własny wkład w realizację zadania",
      sourceExcerpt: fragments[0].slice(0, 500),
      explanation:
        "Poznasz osobiste działania kandydata w zadaniu podobnym do opisanego. Doprecyzuj nazwę umiejętności, jeśli tego potrzebujesz.",
      question: `Opisz własny przykład zadania podobnego do tego z opisu: „${fragments[0].slice(0, 300)}”. Co zrobiłeś/zrobiłaś osobiście, jakie decyzje podjąłeś/podjęłaś i jak sprawdziłeś/sprawdziłaś rezultat?`,
    },
  ];
}
