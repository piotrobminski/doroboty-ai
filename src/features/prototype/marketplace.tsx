import { Link, useLocation, useParams, useSearchParams } from "react-router";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { ArrowUpRight, ChevronDown, MapPin, BriefcaseBusiness, Bookmark } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Search, ArrowRight, Monitor, X } from "lucide-react";
import { BackLink } from "@/components/back-link";
import { DiscoveryHero } from "@/features/public/discovery-hero";
import { AreaLabel } from "@/features/jobs/area-label";
import { categoryLabels, functionLabels } from "@/features/jobs/presentation";
import { SalaryFact } from "@/features/jobs/salary-fact";
import { CompanyLogo } from "@/features/jobs/company-logo";
import { JobCard } from "@/features/jobs/job-card";
import { JobFiltersForm } from "@/features/jobs/job-filters";
import { JobPagination } from "@/features/jobs/job-pagination";
import { JobDescription } from "@/features/jobs/job-description";
import { filterJobs, parseJobFilters } from "@/features/jobs/filters";
import { paginateJobs, jobListingHref } from "@/features/jobs/pagination";
import { remoteLabels, seniorityLabels, contractLabels } from "@/features/jobs/presentation";
import type { JobWithCompany } from "@/features/jobs/types";
import { usePrototype } from "./store";
import { currentPerson, publishedJobs } from "./model";
import { NotFound } from "./shell";
import { cn } from "@/lib/utils";

const facetLabels: Readonly<Record<string, Readonly<Record<string, string>>>> = {
  category: categoryLabels,
  function: functionLabels,
  remote: remoteLabels,
  seniority: seniorityLabels,
  contract: contractLabels,
};
function activeFilterLabel(key: string, value: string | number) {
  return facetLabels[key]?.[String(value)] ?? String(value);
}

function LocalMap({ jobs }: { jobs: JobWithCompany[] }) {
  const [selected, setSelected] = useState<string | null>(null);
  const job = jobs.find((x) => x.id === selected);
  const located = jobs.filter((x) => x.coordinates);
  const locationKey = (x: JobWithCompany) => x.locations[0].trim().toLocaleLowerCase("pl");
  const markers = located.filter(
    (x, index) => located.findIndex((other) => locationKey(other) === locationKey(x)) === index,
  );
  const locationCount = (x: JobWithCompany) =>
    located.filter((other) => locationKey(other) === locationKey(x)).length;
  return (
    <div className="prototype-map-layout">
      <div className="prototype-map" role="region" aria-label="Mapa ofert w Polsce">
        <svg viewBox="0 0 600 520" aria-hidden="true">
          <path
            d="M140 45 220 65 320 40 375 60 440 50 505 150 480 240 520 335 440 420 355 435 310 480 230 435 150 445 90 350 70 260 95 160Z"
            fill="var(--gui-surface-muted)"
            stroke="var(--gui-edge)"
            strokeWidth="2"
          />
        </svg>
        {markers.map((x) => (
          <Button
            key={x.id}
            className="prototype-map-pin"
            size="icon-sm"
            variant={selected === x.id ? "default" : "outline"}
            style={{
              left: `${((x.coordinates!.longitude - 14) / 11) * 80 + 10}%`,
              top: `${((55 - x.coordinates!.latitude) / 6) * 80 + 10}%`,
            }}
            aria-label={`${x.locations.join(" / ")}: ${locationCount(x)} ofert`}
            aria-pressed={selected === x.id}
            onClick={() => setSelected(x.id)}
          >
            {locationCount(x) > 1 ? locationCount(x) : <MapPin />}
          </Button>
        ))}
      </div>
      <div className="prototype-panel">
        {job ? (
          <>
            <h2>{job.title}</h2>
            <p className="mt-3 text-sm text-muted-foreground">
              Oferty w tej lokalizacji: {locationCount(job)}
            </p>
            <p className="my-3">
              {job.company.name} · {job.locations.join(" / ")}
            </p>
            <Link to={`/oferty/${job.slug}`} className={buttonVariants({ variant: "outline" })}>
              Zobacz rolę
            </Link>
          </>
        ) : (
          <p>Wybierz znacznik, aby zobaczyć ofertę.</p>
        )}
        <ul className="mt-5 space-y-3">
          {jobs.map((x) => (
            <li key={x.id}>
              <Link className="text-[var(--gui-link)] underline" to={`/oferty/${x.slug}`}>
                {x.title} · {x.company.name}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
export function JobsPage() {
  const { state } = usePrototype();
  const person = currentPerson(state);
  const [params, setParams] = useSearchParams();
  const filters = parseJobFilters(Object.fromEntries(params));
  const chipButtons = useRef(new Map<string, HTMLButtonElement>());
  const resultsHeading = useRef<HTMLHeadingElement>(null);
  const pendingChipFocus = useRef<string | null>(null);
  useEffect(() => {
    const target = pendingChipFocus.current;
    if (!target) return;
    (chipButtons.current.get(target) ?? resultsHeading.current)?.focus();
    pendingChipFocus.current = null;
  }, [params]);
  const all = publishedJobs(state);
  const jobs = filterJobs(all, filters);
  const pagination = paginateJobs(jobs, filters.page);
  const view = params.get("view") === "map" ? "map" : "list";
  const savedIds =
    person?.role === "candidate"
      ? new Set(state.saved.filter((x) => x.candidateId === person.id).map((x) => x.jobId))
      : undefined;
  function change(key: string, value: string) {
    const next = new URLSearchParams(params);
    next.delete("page");
    if (value) next.set(key, value);
    else next.delete(key);
    setParams(next);
  }
  function removeFilter(key: string) {
    const keys = Object.entries(filters)
      .filter(([name, value]) => name !== "page" && value)
      .map(([name]) => name);
    const index = keys.indexOf(key);
    pendingChipFocus.current = keys[index + 1] ?? keys[index - 1] ?? "results";
    change(key, "");
  }
  function reset() {
    setParams(view === "map" ? { view: "map" } : {});
  }
  function search(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    const next = new URLSearchParams(params);
    next.delete("page");
    for (const key of ["query", "location"]) {
      const value = String(data.get(key) ?? "").trim();
      if (value) next.set(key, value);
      else next.delete(key);
    }
    setParams(next);
  }
  const locations = [...new Set(all.flatMap((x) => x.locations))];
  return (
    <>
      <section className="tph-intro-section">
        <div className="tph-container">
          <DiscoveryHero
            eyebrow="Oferty pracy / Build · Apply · Lead"
            title={
              <>
                Dobra robota.
                <br />
                <span className="text-highlight">Z AI w środku.</span>
              </>
            }
          >
            <p>
              Dla ludzi, którzy tworzą, wdrażają i rozwijają AI.
              <br />
              Znajdź rolę, w której zrobisz coś dobrego.
            </p>
          </DiscoveryHero>
          <form
            key={`${filters.query ?? ""}:${filters.location ?? ""}`}
            className="tph-search-form"
            onSubmit={search}
          >
            <label className="tph-search-field">
              <span>
                <Search className="tph-icon" />
              </span>
              <span className="sr-only">Szukaj ofert</span>
              <input
                name="query"
                aria-label="Szukaj ofert"
                maxLength={100}
                defaultValue={filters.query ?? ""}
                placeholder="Stanowisko, firma lub słowo kluczowe"
              />
            </label>
            <label className="tph-location-field">
              <span>
                <MapPin className="tph-icon" />
              </span>
              <select
                name="location"
                aria-label="Lokalizacja"
                defaultValue={filters.location ?? ""}
              >
                <option value="">Cała Polska</option>
                {[...new Set([...locations, ...(filters.location ? [filters.location] : [])])].map(
                  (x) => (
                    <option key={x}>{x}</option>
                  ),
                )}
              </select>
            </label>
            <Button type="submit" className="tph-search-submit">
              Szukaj <ArrowRight className="tph-icon" />
            </Button>
          </form>
        </div>
      </section>
      <section className="tph-container tph-board-layout">
        <aside className="tph-filter-position" aria-label="Filtry ofert">
          <p className="eyebrow filter-kicker">Obszar pracy</p>
          <div className="tph-category-tabs" aria-label="Kategorie ofert">
            {(
              [
                ["", "Wszystkie oferty", ""],
                ["build", "Build", "Twórz AI"],
                ["apply", "Apply", "Wdrażaj AI"],
                ["lead", "Lead", "Wyznaczaj kierunek"],
              ] as const
            ).map(([key, label, description]) => (
              <button
                key={key}
                className={cn(
                  "tph-category-tab",
                  (filters.category ?? "") === key && "tph-selected",
                )}
                aria-pressed={(filters.category ?? "") === key}
                onClick={() => change("category", key)}
              >
                <span>
                  <b>{label}</b>
                  <small>{description}</small>
                </span>
                <span className="tph-category-count">
                  {filterJobs(all, { ...filters, category: key || undefined }).length}
                </span>
              </button>
            ))}
          </div>

          <details className="additional-filters" open>
            <summary>
              Więcej filtrów <ChevronDown size={18} aria-hidden="true" />
            </summary>
            <JobFiltersForm filters={filters} onChange={change} onReset={reset} />
          </details>
          <div className="sidebar-note">
            <p className="eyebrow">Ludzie × Technologia</p>
            <p>
              Dobra praca
              <br />
              zaczyna się
              <br />
              od człowieka.
            </p>
            <Link className="text-link" to="/metodologia">
              Poznaj nasze kryteria <ArrowUpRight />
            </Link>
          </div>
        </aside>
        <div className="tph-results-column">
          <div className="tph-results-heading">
            <div className="tph-results-title">
              <h2 ref={resultsHeading} tabIndex={-1}>
                Oferty pracy
              </h2>
              <span role="status">{jobs.length}</span>
            </div>
            <div className="tph-results-controls">
              <span className="tph-sort-label">Najnowsze</span>
              <Link
                className="tph-view-link"
                aria-current={view === "list" ? "page" : undefined}
                to={jobListingHref(filters)}
              >
                Lista
              </Link>
              <Link
                className="tph-view-link"
                aria-current={view === "map" ? "page" : undefined}
                to={jobListingHref(filters, 1, "map")}
              >
                Mapa
              </Link>
            </div>
          </div>
          <p className="results-context">Przykładowe role w prototypie · Build / Apply / Lead</p>
          {Object.entries(filters).some(([k, v]) => k !== "page" && v) && (
            <div className="tph-active-filters">
              {Object.entries(filters)
                .filter(([k, v]) => k !== "page" && v)
                .map(([key, value]) => (
                  <button
                    className="tph-filter-chip"
                    key={key}
                    aria-label={`Usuń filtr: ${activeFilterLabel(key, value)}`}
                    ref={(element) => {
                      if (element) chipButtons.current.set(key, element);
                      else chipButtons.current.delete(key);
                    }}
                    onClick={() => removeFilter(key)}
                  >
                    {activeFilterLabel(key, value)} <X className="tph-icon" />
                  </button>
                ))}
              <button className="tph-text-button" onClick={reset}>
                Wyczyść
              </button>
            </div>
          )}
          {jobs.length ? (
            view === "map" ? (
              <LocalMap jobs={jobs} />
            ) : (
              <>
                <div className="tph-job-list">
                  {pagination.items.map((job) => (
                    <JobCard key={job.id} job={job} saved={savedIds?.has(job.id)} />
                  ))}
                </div>
                <JobPagination pagination={pagination} filters={filters} />
              </>
            )
          ) : (
            <div className="tph-empty-state">
              <span className="tph-empty-mark">
                <Search className="tph-icon" />
              </span>
              <h3>Brak ofert dla tych filtrów</h3>
              <p>Wyczyść część kryteriów i spróbuj ponownie.</p>
              <Button onClick={reset}>Pokaż wszystkie oferty</Button>
            </div>
          )}
        </div>
      </section>
    </>
  );
}

export function JobPage() {
  const { slug } = useParams();
  const location = useLocation();
  useEffect(() => {
    const target =
      location.hash === "#role" ? "role" : location.hash === "#employer" ? "employer" : null;
    if (!target) return;
    // Run after the shell's route focus handling, including direct deep links.
    const frame = requestAnimationFrame(() => {
      const section = document.getElementById(target);
      section?.focus({ preventScroll: true });
      section?.scrollIntoView({ behavior: "instant", block: "start" });
    });
    return () => cancelAnimationFrame(frame);
  }, [location.hash, location.key, slug]);
  const { state, run } = usePrototype();
  const person = currentPerson(state);
  const job = publishedJobs(state).find((x) => x.slug === slug);
  if (!job) return <NotFound />;
  const saved = state.saved.some((x) => x.candidateId === person?.id && x.jobId === job.id);
  const submitted = state.applications.find(
    (x) => x.candidateId === person?.id && x.jobId === job.id,
  );
  const related = publishedJobs(state)
    .filter((x) => x.id !== job.id)
    .sort((a, b) => Number(b.category === job.category) - Number(a.category === job.category))
    .slice(0, 3);
  return (
    <article className="tph-offer-page tph-container tph-offer-main">
      <nav className="tph-offer-breadcrumb" aria-label="Powrót do ofert">
        <BackLink to="/oferty">Wróć do ofert</BackLink>
        <span>{job.company.name}</span>
      </nav>
      <div className="tph-offer-grid">
        <header className="tph-offer-hero">
          <div className="tph-offer-identity">
            <CompanyLogo company={job.company} area={job.category} />
            <div>
              <Link className="tph-offer-company-link" to={`/firmy/${job.company.slug}`}>
                {job.company.name}
                <ArrowUpRight className="tph-icon" />
              </Link>
              <p className="tph-offer-date">
                Opublikowano {new Intl.DateTimeFormat("pl-PL").format(new Date(job.publishedAt))}
              </p>
            </div>
            <AreaLabel area={job.category} />
          </div>
          <h1>{job.title}</h1>
          <div className="tph-offer-key-facts">
            <span>
              <MapPin className="tph-icon" />
              {job.locations.join(" / ")}
            </span>
            <span>
              <Monitor className="tph-icon" />
              {remoteLabels[job.remoteStatus]}
            </span>
            <span>
              <BriefcaseBusiness className="tph-icon" />
              {seniorityLabels[job.seniority]}
            </span>
          </div>
          <div className="tph-offer-skill-row">
            <span>{functionLabels[job.function]}</span>
          </div>
          <div className="tph-offer-hero-bottom">
            <span>{job.summary}</span>
          </div>
        </header>
        <aside className="tph-offer-sidebar">
          <div className="tph-offer-action-card">
            <div className="tph-offer-pay">
              <p className="tph-offer-eyebrow">Wynagrodzenie</p>
              <SalaryFact job={job} />
            </div>
            <h2 className="sr-only">Konkrety</h2>
            <dl className="tph-offer-terms">
              {[
                ["Forma współpracy", contractLabels[job.contract]],
                ["Tryb pracy", remoteLabels[job.remoteStatus]],
                ["Lokalizacja", job.locations.join(" / ")],
                ["Doświadczenie", seniorityLabels[job.seniority]],
              ].map(([key, value]) => (
                <div key={key}>
                  <dt>{key}</dt>
                  <dd>{value}</dd>
                </div>
              ))}
            </dl>
            <div className="tph-offer-actions">
              {person?.role === "candidate" ? (
                <>
                  <Link
                    className={buttonVariants({ variant: "lime" })}
                    to={submitted ? `/app/aplikacje/${submitted.id}` : `/aplikuj/${job.slug}`}
                  >
                    {submitted ? "Zobacz swoją aplikację" : "Aplikuj"}
                    <ArrowRight />
                  </Link>
                  <Button
                    variant="outline"
                    aria-label="Zapisz ofertę"
                    aria-pressed={saved}
                    onClick={() => run({ type: "toggle_saved", jobId: job.id })}
                  >
                    <Bookmark className={cn(saved && "fill-current")} />
                    Zapisz ofertę
                  </Button>
                </>
              ) : !person ? (
                <Link
                  className={buttonVariants({ variant: "lime" })}
                  to={`/auth/sign-in?audience=candidate&next=${encodeURIComponent(`/aplikuj/${job.slug}`)}`}
                >
                  Zaloguj się i aplikuj
                </Link>
              ) : (
                <p>Aplikacje są dostępne z profilu kandydata.</p>
              )}
              <p>Prototyp: aplikacja zostaje w tym przeglądarkowym scenariuszu.</p>
            </div>
          </div>
        </aside>
        <div className="tph-offer-description">
          <nav className="tph-offer-section-nav" aria-label="Sekcje oferty">
            <Link to={{ pathname: `/oferty/${job.slug}`, hash: "#role" }}>O roli</Link>
            <Link to={{ pathname: `/oferty/${job.slug}`, hash: "#employer" }}>O firmie</Link>
          </nav>
          <div className="tph-offer-reading">
            <section id="role" tabIndex={-1} className="tph-offer-section">
              <h2>O roli</h2>
              <JobDescription description={job.description} />
            </section>
          </div>
        </div>
        <section className="tph-offer-employer" id="employer" tabIndex={-1}>
          <div className="tph-employer-top">
            <CompanyLogo company={job.company} area={job.category} />
            <div>
              <p className="tph-offer-eyebrow">Poznaj firmę</p>
              <h2>{job.company.name}</h2>
            </div>
          </div>
          <div className="tph-employer-copy">
            <div>
              <p>{job.company.description}</p>
              <Link
                className={buttonVariants({ variant: "outline", size: "sm" })}
                to={`/firmy/${job.company.slug}`}
              >
                Oferty tej firmy <ArrowRight />
              </Link>
            </div>
          </div>
        </section>
      </div>
      {related.length > 0 && (
        <section className="tph-offer-related">
          <div className="tph-offer-related-heading">
            <h2>Może też Cię zainteresować</h2>
            <Link to="/oferty">
              Wszystkie oferty <ArrowRight className="tph-icon" />
            </Link>
          </div>
          <div className="tph-job-list">
            {related.map((x) => (
              <JobCard key={x.id} job={x} />
            ))}
          </div>
        </section>
      )}
    </article>
  );
}

export function CompanyPage() {
  const { slug } = useParams();
  const { state } = usePrototype();
  const company = state.companies.find((x) => x.slug === slug);
  if (!company) return <NotFound />;
  const jobs = publishedJobs(state).filter((x) => x.companyId === company.id);
  return (
    <article className="tph-container company-page">
      <div className="company-layout">
        <div className="company-intro">
          <p className="eyebrow">Firma / Scenariusz przykładowy</p>
          <CompanyLogo company={company} size="large" />
          <h1 className="mt-3 text-4xl font-semibold tracking-[var(--gui-tracking-s)] sm:text-5xl">
            {company.name}
          </h1>
          <p className="mt-5 max-w-3xl text-lg leading-relaxed">{company.summary}</p>
          <p className="mt-5 max-w-3xl text-base leading-relaxed text-muted-foreground">
            {company.description}
          </p>
        </div>
        <aside className="prototype-panel company-facts" aria-label="Informacje o firmie">
          <dl>
            <div className="flex gap-2">
              <dt className="font-medium">Lokalizacja</dt>
              <dd className="mt-1 text-muted-foreground">{company.location}</dd>
            </div>
            <div className="mt-5 flex gap-2">
              <dt className="font-medium">Wielkość</dt>
              <dd className="mt-1 text-muted-foreground">{company.sizeLabel}</dd>
            </div>
          </dl>
          {/^https?:\/\//i.test(company.websiteUrl) && (
            <a
              className="mt-6 inline-flex items-center gap-2 font-medium text-[var(--gui-link)] hover:underline"
              href={company.websiteUrl}
              target="_blank"
              rel="noreferrer"
            >
              Strona firmy <ArrowUpRight className="size-4" />
            </a>
          )}
        </aside>
      </div>
      <section className="py-12">
        <h2 className="text-2xl font-semibold">Otwarte role</h2>
        {jobs.length > 0 ? (
          <div className="mt-7 tph-job-list">
            {jobs.map((job) => (
              <JobCard key={job.id} job={job} />
            ))}
          </div>
        ) : (
          <div className="mt-6">
            <p>Ta firma nie ma teraz aktywnych ofert.</p>
            <Link className="text-link mt-4" to="/oferty">
              Przeglądaj wszystkie oferty <ArrowRight />
            </Link>
          </div>
        )}
      </section>
    </article>
  );
}
