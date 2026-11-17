import { useId } from "react";
import { Link } from "react-router";
import { Bookmark, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePrototype } from "@/features/prototype/store";
import { currentPerson } from "@/features/prototype/model";
import type { JobWithCompany } from "./types";
import { functionLabels, remoteLabels, seniorityLabels } from "./presentation";
import { CompanyLogo } from "./company-logo";
import { SalaryFact } from "./salary-fact";
import { AreaLabel } from "./area-label";
export function JobCard({ job, saved }: { job: JobWithCompany; saved?: boolean }) {
  const { state, run } = usePrototype();
  const headingId = useId();
  const person = currentPerson(state);
  const savedState =
    person?.role === "candidate"
      ? (saved ??
        state.saved.some((item) => item.candidateId === person.id && item.jobId === job.id))
      : undefined;
  return (
    <article className="tph-job-card" aria-labelledby={headingId}>
      <div className="tph-card-top">
        <CompanyLogo company={job.company} area={job.category} />
        <div className="tph-job-main">
          <div className="tph-job-topline">
            <Link className="tph-job-company" to={`/firmy/${job.company.slug}`}>
              {job.company.name}
            </Link>
            <AreaLabel area={job.category} />
          </div>
          <h3 className="tph-job-title" id={headingId}>
            <Link to={`/oferty/${job.slug}`}>{job.title}</Link>
          </h3>
        </div>
        {savedState !== undefined && (
          <Button
            className="tph-save-button"
            variant="ghost"
            size="icon"
            aria-label={`Zapisz ofertę: ${job.title}`}
            aria-pressed={savedState}
            onClick={() => run({ type: "toggle_saved", jobId: job.id })}
          >
            <Bookmark aria-hidden="true" />
          </Button>
        )}
      </div>
      <div className="tph-card-facts">
        <div className="tph-job-facts">
          <MapPin className="tph-icon" aria-hidden="true" />
          <span>{job.locations.join(" / ")}</span>
          <span aria-hidden="true">·</span>
          <span>{remoteLabels[job.remoteStatus]}</span>
        </div>
        <SalaryFact job={job} />
      </div>
      <div className="tph-card-bottom">
        <div className="tph-job-tags">
          <span>{seniorityLabels[job.seniority]}</span>
          <span>{functionLabels[job.function]}</span>
        </div>
        <time className="tph-job-age" dateTime={job.publishedAt}>
          {new Intl.DateTimeFormat("pl-PL", { day: "numeric", month: "short" }).format(
            new Date(job.publishedAt),
          )}
        </time>
      </div>
    </article>
  );
}
