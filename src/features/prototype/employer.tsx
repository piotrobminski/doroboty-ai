import { useState, type FormEvent } from "react";
import { Link } from "react-router";
import { FormSection } from "@/components/form-section";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { currentPerson } from "./model";
import { usePrototype } from "./store";
import { Field } from "./workspace";
import { Empty, PageTitle } from "./shell";

export function EmployerJobs() {
  const { state } = usePrototype();
  const person = currentPerson(state)!;
  const jobs = state.jobs.filter((x) => x.companyId === person.companyId);
  return (
    <>
      <PageTitle
        description="Buduj zespół wokół konkretnych zadań. Zarządzaj swoimi rolami i zgłoszeniami."
        action={
          <Link to="/app/oferty/nowa" className={buttonVariants()}>
            Dodaj ofertę
          </Link>
        }
      >
        Moje oferty
      </PageTitle>
      <div className="space-y-4">
        {jobs.length ? (
          jobs.map((job) => (
            <article key={job.id} className="prototype-panel">
              <div className="flex flex-wrap justify-between gap-4">
                <div>
                  <Link className="work-list-title" to={`/app/oferty/${job.id}`}>
                    {job.title}
                  </Link>
                  <p className="mt-3 text-muted-foreground">
                    {job.competencyCard && (
                      <Link
                        className="block mb-3 text-[var(--gui-link)] underline"
                        to={`/auth/sign-in?audience=candidate&next=${encodeURIComponent(`/aplikuj/${job.slug}`)}`}
                      >
                        Formularz karty PR02
                      </Link>
                    )}
                    {state.applications.filter((x) => x.jobId === job.id).length} aplikacji ·{" "}
                    {job.publicationStatus === "published" ? "Opublikowana" : "Szkic"}
                  </p>
                </div>
                <Link
                  to={`/oferty/${job.slug}`}
                  className={buttonVariants({ variant: "outline", size: "sm" })}
                >
                  Zobacz ofertę
                </Link>
              </div>
            </article>
          ))
        ) : (
          <Empty>Nie masz jeszcze ofert. Dodaj pierwszą ofertę.</Empty>
        )}
      </div>
    </>
  );
}
export { EmployerJobEditor } from "./job-editor";
export function CompanyEditor() {
  const { state, run } = usePrototype();
  const person = currentPerson(state)!;
  const company = state.companies.find((x) => x.id === person.companyId)!;
  const [message, setMessage] = useState("");
  function save(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    if (
      run({
        type: "company",
        name: String(data.get("name")),
        description: String(data.get("description")),
      })
    )
      setMessage("Dane firmy zostały zapisane.");
  }
  return (
    <>
      <PageTitle description="Pokaż kandydatom, kim jesteście i nad czym pracujecie.">
        Twoja organizacja
      </PageTitle>
      <form className="prototype-panel prototype-form" onSubmit={save}>
        <FormSection index="01" title="Poznaj firmę">
          <Field label="Nazwa firmy">
            <Input name="name" required maxLength={200} defaultValue={company.name} />
          </Field>
          <Field label="Opis firmy">
            <Textarea name="description" maxLength={12000} defaultValue={company.description} />
          </Field>
        </FormSection>
        <Button type="submit">Zapisz dane firmy</Button>
        {message && <p role="status">{message}</p>}
        <Link className="text-[var(--gui-link)]" to={`/firmy/${company.slug}`}>
          Zobacz profil firmy
        </Link>
      </form>
    </>
  );
}
