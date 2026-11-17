import { useId } from "react";
import { FormSelect } from "@/components/ui/form-select";
import type { JobFilters } from "./types";
import { contractLabels, functionLabels, remoteLabels, seniorityLabels } from "./presentation";

export function JobFiltersForm({
  filters,
  onChange,
  onReset,
}: {
  filters: JobFilters;
  onChange: (key: string, value: string) => void;
  onReset: () => void;
}) {
  const prefix = useId();
  return (
    <div className="tph-filter-panel">
      <div className="tph-filter-heading">
        <h2>Po Twojemu</h2>
        <button className="tph-text-button" onClick={onReset}>
          Wyczyść
        </button>
      </div>
      {(
        [
          ["remote", "Tryb pracy", remoteLabels],
          ["seniority", "Doświadczenie", seniorityLabels],
          ["contract", "Forma współpracy", contractLabels],
          ["function", "Funkcja", functionLabels],
        ] as const
      ).map(([key, label, options]) => (
        <div className="tph-facet" key={key}>
          <label htmlFor={`${prefix}-${key}`}>{label}</label>
          <FormSelect
            id={`${prefix}-${key}`}
            ariaLabel={label}
            value={filters[key] ?? ""}
            options={[
              { value: "", label: "Wszystkie" },
              ...Object.entries(options).map(([value, label]) => ({ value, label })),
            ]}
            onValueChange={(value) => onChange(key, value)}
          />
        </div>
      ))}
    </div>
  );
}
