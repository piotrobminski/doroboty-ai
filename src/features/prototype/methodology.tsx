import { PageTitle } from "./shell";
const criteria = [
  ["AI zmienia pracę", "Technologia wpływa na odpowiedzialność, decyzje lub rezultat stanowiska."],
  [
    "Wynik da się zobaczyć",
    "Opis roli wskazuje problem, odbiorcę i efekt, a nie samą listę narzędzi.",
  ],
  [
    "Człowiek zachowuje odpowiedzialność",
    "Automatyzacja wspiera decyzję; nie ukrywa jej autora ani konsekwencji.",
  ],
  [
    "Oferta daje konkret",
    "Pokazuje tryb pracy, poziom, formę współpracy i — kiedy to możliwe — wynagrodzenie.",
  ],
] as const;

export default function MethodologyPage() {
  return (
    <article className="prototype-section information-page">
      <PageTitle
        eyebrow="Nasze kryteria / Praca z AI"
        description="DoRoboty.ai pokazuje role, w których AI jest częścią realnej odpowiedzialności i mierzalnego wyniku."
      >
        Nie każda praca z chatbotem jest pracą z AI.
      </PageTitle>
      <div className="mt-12 grid gap-5 sm:grid-cols-2">
        {criteria.map(([title, body], index) => (
          <section key={title} className="prototype-panel">
            <span className="text-xs font-medium text-muted-foreground">0{index + 1}</span>
            <h2 className="mt-3 text-xl font-semibold">{title}</h2>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{body}</p>
          </section>
        ))}
      </div>
      <section className="prototype-panel mt-12">
        <h2 className="text-2xl font-semibold">Weryfikacja nie jest rekomendacją</h2>
        <p className="mt-3 text-base leading-relaxed text-muted-foreground">
          Sprawdzamy źródło i kompletność informacji. Kandydat nadal powinien sam ocenić firmę,
          warunki i dopasowanie roli.
        </p>
      </section>
    </article>
  );
}
