import type { Job } from "./types";
import { categoryLabels } from "./presentation";
type Area = Job["category"];
/** C-scheme symbols adapted from the immutable reference into JSX. */
export function AreaIcon({ area }: { area: Area }) {
  return (
    <svg
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {area === "build" ? (
        <>
          <rect x="2.5" y="3" width="5" height="5" rx="1" />
          <rect x="12.5" y="12" width="5" height="5" rx="1" />
          <path d="M7.5 5.5H15v6.5" />
        </>
      ) : area === "apply" ? (
        <path d="M10 2.5v15M2.5 10h15M4.7 4.7l10.6 10.6M4.7 15.3 15.3 4.7" />
      ) : (
        <>
          <circle cx="10" cy="10" r="2.5" />
          <circle cx="3" cy="3" r="1.5" />
          <circle cx="17" cy="3" r="1.5" />
          <circle cx="3" cy="17" r="1.5" />
          <circle cx="17" cy="17" r="1.5" />
          <path d="m4.2 4.2 4 4m3.6 0 4-4m-11.6 11.6 4-4m3.6 0 4 4" />
        </>
      )}
    </svg>
  );
}
export function AreaLabel({ area }: { area: Area }) {
  return (
    <span className="area-label" data-area={area}>
      <AreaIcon area={area} />
      {categoryLabels[area]}
    </span>
  );
}
