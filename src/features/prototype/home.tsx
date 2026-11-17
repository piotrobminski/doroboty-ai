import { Link } from "react-router";
import { ArrowRight } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { JobCard } from "@/features/jobs/job-card";
import { usePrototype } from "./store";
import { publishedJobs } from "./model";
import { DiscoveryHero } from "@/features/public/discovery-hero";
import { AreaLabel } from "@/features/jobs/area-label";

const categories = [
  {
    slug: "build",
    label: "Build",
    description: "Tworzysz modele, systemy i produkty wykorzystujące AI.",
  },
  {
    slug: "apply",
    label: "Apply",
    description: "Używasz AI, żeby lepiej wykonywać swoją właściwą pracę.",
  },
  {
    slug: "lead",
    label: "Lead",
    description: "Prowadzisz zmianę, decyzje i zespoły w świecie AI.",
  },
] as const;

export default function HomePage() {
  const { state } = usePrototype();
  const latestJobs = publishedJobs(state).slice(0, 4);
  return (
    <>
      <section className="tph-container">
        <DiscoveryHero
          eyebrow="Praca z AI. Po ludzku."
          title={
            <>
              Praca dla ludzi,
              <br />
              którzy <span className="text-highlight">dowożą z AI.</span>
            </>
          }
          actions={
            <>
              <Link to="/oferty" className={buttonVariants()}>
                Zobacz oferty <ArrowRight />
              </Link>
              <Link to="/metodologia" className={buttonVariants({ variant: "outline" })}>
                Jak wybieramy role
              </Link>
            </>
          }
        >
          <p>
            Role, w których AI jest częścią odpowiedzialności, decyzji i wyniku pracy. Znajdź
            miejsce na swój kolejny krok.
          </p>
        </DiscoveryHero>
      </section>
      <section className="tph-container home-section">
        <p className="eyebrow">01 / Trzy sposoby pracy z AI</p>
        <h2>Różne drogi. Wspólny kierunek.</h2>
        <div className="home-area-grid">
          {categories.map((category, index) => (
            <article key={category.slug} className="prototype-panel">
              <span className="eyebrow">0{index + 1} / Obszar pracy</span>
              <AreaLabel area={category.slug} />
              <h3>{category.label}</h3>
              <p>{category.description}</p>
              <Link className="text-link" to={`/oferty?category=${category.slug}`}>
                Przeglądaj role <ArrowRight />
              </Link>
            </article>
          ))}
        </div>
      </section>
      <section className="tph-container home-section">
        <div className="home-section-heading">
          <div>
            <p className="eyebrow">02 / Aktualne role</p>
            <h2>Najnowsze oferty</h2>
          </div>
          <Link className="text-link" to="/oferty">
            Wszystkie oferty <ArrowRight />
          </Link>
        </div>
        <div className="tph-job-list">
          {latestJobs.map((job) => (
            <JobCard key={job.id} job={job} />
          ))}
        </div>
      </section>
    </>
  );
}
