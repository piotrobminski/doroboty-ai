import { ArrowUpRight } from "lucide-react";
export function BrandMark({ className = "" }: { className?: string }) {
  return (
    <span aria-hidden="true" className={`brand-mark ${className}`}>
      <ArrowUpRight size={27} strokeWidth={1.3} />
    </span>
  );
}
