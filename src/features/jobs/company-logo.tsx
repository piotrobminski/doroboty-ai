import { CompanyLogoImage } from "@/features/jobs/company-logo-image";
import { companyInitials, companyLogoUrl } from "@/features/jobs/company-logos";
import type { Company } from "@/features/jobs/types";
import { AreaIcon } from "./area-label";
import type { Job } from "./types";
import { cn } from "@/lib/utils";

export function CompanyLogo({
  company,
  size = "default",
  area,
}: {
  company: Pick<Company, "name" | "slug" | "logoUrl">;
  size?: "default" | "large";
  area?: Job["category"];
}) {
  const src = companyLogoUrl(company);
  const dimension = size === "large" ? 64 : 43;
  const initials = companyInitials(company.name);

  return (
    <span
      aria-hidden="true"
      data-company-logo={company.slug}
      className={cn("company-mark", size === "large" && "company-mark-large")}
    >
      <span className="company-logo-face">
        {src ? <CompanyLogoImage src={src} dimension={dimension} initials={initials} /> : initials}
      </span>
      {area && (
        <span className="area-marker" data-area={area}>
          <AreaIcon area={area} />
        </span>
      )}
    </span>
  );
}
