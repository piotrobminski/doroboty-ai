import { Link, useLocation, useSearchParams } from "react-router";
import { buttonVariants } from "@/components/ui/button";
import { usePrototype } from "./store";

export function ArchiveLinks({ current, archive }: { current: string; archive: string }) {
  const { pathname } = useLocation();
  const { refresh } = usePrototype();
  const [params] = useSearchParams();
  const archived = params.get("archiwum") === "1";
  function destination(showArchive: boolean) {
    const next = new URLSearchParams(params);
    next.delete("wyslano");
    if (showArchive) next.set("archiwum", "1");
    else next.delete("archiwum");
    return { pathname, search: next.toString() };
  }
  return (
    <nav className="mb-6 flex flex-wrap gap-2" aria-label="Widok archiwum">
      <Link
        to={destination(false)}
        onClick={() => void refresh()}
        className={buttonVariants({ variant: archived ? "outline" : "default" })}
        aria-current={archived ? undefined : "page"}
      >
        {current}
      </Link>
      <Link
        to={destination(true)}
        onClick={() => void refresh()}
        className={buttonVariants({ variant: archived ? "default" : "outline" })}
        aria-current={archived ? "page" : undefined}
      >
        {archive}
      </Link>
    </nav>
  );
}
