import { useId, type ReactNode } from "react";

/** A named group within one form, never a second form or a simulated stepper. */
export function FormSection({
  index,
  title,
  eyebrow = "Twoje dane",
  description,
  children,
}: {
  index: string;
  title: string;
  eyebrow?: string;
  description?: string;
  children: ReactNode;
}) {
  const id = useId();
  return (
    <section className="form-group" aria-labelledby={id}>
      <header className="form-group-heading">
        <p className="eyebrow">
          {index} / {eyebrow}
        </p>
        <h2 id={id}>{title}</h2>
        {description && <p>{description}</p>}
      </header>
      {children}
    </section>
  );
}
