import { emptyDraft, getDraft, saveDraft, draftToJob, validateDraft, publishJob, getJobs } from './job-store.mjs';
import { offerMarkup, escapeHTML, salaryText } from './job-view.mjs';
import { employerMark, areaLabels, areaSVG } from './icon-schemes.mjs';

const $ = selector => document.querySelector(selector);
const form = $('#job-form');
const restored = getDraft();
let currentStep = 1;
let saveTimer;
let publishing = false;
let draft = { ...emptyDraft, ...(restored?.values || {}) };
for (const [name, value] of Object.entries(draft)) { const control = form.elements.namedItem(name); if (!control) continue; if (control.type === 'checkbox') control.checked = value; else control.value = value; }
function values() { const v = { ...emptyDraft }; for (const name of Object.keys(v)) { const c = form.elements.namedItem(name); v[name] = c?.type === 'checkbox' ? c.checked : String(c?.value || ''); } return v; }
function notify(message) { $('#toast').textContent = message; $('#toast').classList.add('visible'); setTimeout(() => $('#toast').classList.remove('visible'), 3000); }
function persist({ manual = false } = {}) { clearTimeout(saveTimer); draft = values(); try { saveDraft(draft, currentStep); $('#draft-status').textContent = `Szkic zapisany lokalnie · ${new Intl.DateTimeFormat('pl-PL', { hour: '2-digit', minute: '2-digit' }).format(new Date())}`; if (manual) notify('Szkic zapisany. Możesz wrócić do niego w tej przeglądarce.'); return true; } catch { $('#draft-status').textContent = 'Nie udało się zapisać szkicu w tej przeglądarce.'; if (manual) notify('Zapis jest niedostępny. Pozostaw tę stronę otwartą, aby zachować wprowadzone dane.'); return false; } }
function fieldError(name, message = '') { const output = document.getElementById(`${name}-error`); if (output) output.textContent = message; const controls = name === 'category' ? form.querySelectorAll('[name="category"]') : [form.elements.namedItem(name)]; for (const control of controls) control?.setAttribute('aria-invalid', String(Boolean(message))); }
function validate(step, focus = true) {
  const errors = validateDraft(values(), step);
  const fields = step === 1 ? ['title', 'company', 'category', 'level', 'mode', 'contract', 'city', 'salaryMin', 'salaryMax', 'skills'] : ['summary', 'responsibilities', 'requirements', 'applicationUrl'];
  for (const name of fields) fieldError(name, errors[name]);
  $('#form-error-summary').hidden = !Object.keys(errors).length;
  $('#form-error-summary').textContent = Object.keys(errors).length ? 'Sprawdź zaznaczone pola — pomogą kandydatom zrozumieć Twoją ofertę.' : '';
  if (Object.keys(errors).length && focus) { const first = Object.keys(errors)[0]; const control = first === 'category' ? form.querySelector('[name="category"]') : form.elements.namedItem(first); control?.focus(); }
  return !Object.keys(errors).length;
}
function updateSummary() {
  const v = values();
  const identity = { company: v.company.trim() || 'Twoja firma', initials: (v.company.trim() || 'F').split(/\s+/).slice(0, 2).map(w => w[0]).join('').toUpperCase(), category: v.category, level: v.level };
  const knownSalary = !v.salaryHidden && Number(v.salaryMin) > 0 && Number(v.salaryMax) >= Number(v.salaryMin);
  const salaryJob = { min: knownSalary ? Number(v.salaryMin) : null, max: knownSalary ? Number(v.salaryMax) : null, contract: v.contract };
  $('#composer-summary-content').innerHTML = `<div class="summary-company">${employerMark(identity)}<span>${escapeHTML(identity.company)}</span></div><h2>${escapeHTML(v.title.trim() || 'Twoja nowa oferta')}</h2><span class="area-label tone-area-${v.category}">${areaSVG(v.category)}${v.category} / ${areaLabels[v.category] || ''}</span><dl class="summary-facts"><div><dt>Doświadczenie</dt><dd>${escapeHTML(v.level || 'Do uzupełnienia')}</dd></div><div><dt>Miejsce pracy</dt><dd>${escapeHTML(v.mode === 'Zdalnie' ? 'Zdalnie / Polska' : v.city || 'Do uzupełnienia')}</dd></div><div><dt>Współpraca</dt><dd>${v.contract === 'UoP' ? 'Umowa o pracę' : 'B2B'}</dd></div></dl><div class="summary-salary"><strong>${v.salaryHidden ? 'Widełki niepodane' : knownSalary ? salaryText(salaryJob) : 'Uzupełnij widełki'}</strong><small>${v.salaryHidden ? 'Wynagrodzenie do ustalenia z firmą' : `${v.contract === 'B2B' ? 'Netto' : 'Brutto'} / miesiąc`}</small></div>`;
  $('#salary-basis-label').textContent = v.contract === 'B2B' ? 'Netto / B2B' : 'Brutto / umowa o pracę';
  $('#salaryMin').disabled = v.salaryHidden;
  $('#salaryMax').disabled = v.salaryHidden;
  $('#city-label').innerHTML = v.mode === 'Zdalnie' ? 'Siedziba firmy <span class="optional-label">opcjonalnie</span>' : 'Miasto <span aria-hidden="true">*</span>';
  $('#city').required = v.mode !== 'Zdalnie';
  $('#summary-count').textContent = `${v.summary.length} / 1200`;
}
function showStep(step, { focus = true } = {}) {
  currentStep = step;
  document.querySelectorAll('[data-step-panel]').forEach(panel => { panel.hidden = Number(panel.dataset.stepPanel) !== step; });
  document.querySelectorAll('[data-go-step]').forEach(button => { const selected = Number(button.dataset.goStep) === step; if (selected) button.setAttribute('aria-current', 'step'); else button.removeAttribute('aria-current'); button.classList.toggle('completed', Number(button.dataset.goStep) < step); });
  $('#previous-step').hidden = step === 1;
  $('#next-step').innerHTML = step === 1 ? 'Dalej: opis oferty <span aria-hidden="true">↗</span>' : step === 2 ? 'Sprawdź podgląd <span aria-hidden="true">↗</span>' : 'Opublikuj ofertę demo <span aria-hidden="true">↗</span>';
  $('#publish-note').hidden = step !== 3;
  $('.creator-layout').classList.toggle('showing-preview', step === 3);
  $('#form-error-summary').hidden = true;
  if (step === 3) { $('#offer-preview').innerHTML = offerMarkup(draftToJob(values()), { preview: true }); persist(); }
  if (focus) { const heading = document.getElementById(step === 1 ? 'step-one-title' : step === 2 ? 'step-two-title' : 'step-three-title'); heading.focus({ preventScroll: true }); $('.composer-steps').scrollIntoView({ block: 'start', behavior: 'smooth' }); }
}
function goTo(step) {
  if (step > currentStep) { for (let s = 1; s < step; s++) { if (!validate(s, false)) { showStep(s, { focus: false }); validate(s); return; } } }
  showStep(step); persist();
}
form.addEventListener('input', event => { if (event.target.name) fieldError(event.target.name); if (event.target.name === 'salaryHidden' && event.target.checked) { fieldError('salaryMin'); fieldError('salaryMax'); } updateSummary(); $('#draft-status').textContent = 'Zapisywanie szkicu…'; clearTimeout(saveTimer); saveTimer = setTimeout(() => persist(), 600); });
form.addEventListener('change', () => { updateSummary(); clearTimeout(saveTimer); saveTimer = setTimeout(() => persist(), 300); });
$('#save-draft').addEventListener('click', () => persist({ manual: true }));
document.querySelectorAll('[data-go-step]').forEach(button => button.addEventListener('click', () => goTo(Number(button.dataset.goStep))));
$('#previous-step').addEventListener('click', () => goTo(currentStep - 1));
function showPublished(job) {
  $('#creator-workspace').hidden = true;
  $('.creator-intro').hidden = true;
  $('#publish-success').hidden = false;
  $('#publish-success').innerHTML = `<span class="success-symbol" aria-hidden="true">↗</span><p class="eyebrow">Oferta dodana do lokalnego podglądu</p><h1 id="published-title">Nowy kierunek.<br>Nowe możliwości.</h1><p>Oferta <strong>${escapeHTML(job.title)}</strong> jest już na demonstracyjnej liście. Możesz otworzyć ją z perspektywy kandydata.</p><div class="published-summary">${employerMark(job)}<div><strong>${escapeHTML(job.company)}</strong><span>${job.category} · ${escapeHTML(job.level)} · ${escapeHTML(job.mode)}</span></div></div><div class="published-actions"><a class="button button-dark" href="job.html?id=${encodeURIComponent(job.id)}">Zobacz ofertę <span aria-hidden="true">↗</span></a><a class="button button-outline" href="./#offers">Przejdź do listingu</a><a class="publish-another" href="create-job.html">Dodaj kolejną ofertę ↗</a></div><p class="local-publish-note">Zapisano tylko w tej przeglądarce. To lokalny prototyp, nie publiczna publikacja ogłoszenia.</p>`;
  $('#publish-success').focus({ preventScroll: true });
  window.scrollTo({ top: 0, behavior: 'smooth' });
}
form.addEventListener('submit', event => {
  event.preventDefault();
  if (currentStep < 3) { if (validate(currentStep)) { showStep(currentStep + 1); persist(); } return; }
  if (publishing) return;
  for (const s of [1, 2]) if (!validate(s, false)) { showStep(s, { focus: false }); validate(s); return; }
  publishing = true;
  clearTimeout(saveTimer);
  $('#next-step').disabled = true;
  try {
    const job = publishJob(draftToJob(values(), { id: `local-${crypto.randomUUID()}` }));
    history.replaceState(null, '', `create-job.html?published=${encodeURIComponent(job.id)}`);
    showPublished(job);
  } catch { $('#form-error-summary').textContent = 'Nie udało się zapisać oferty. Dane pozostają w formularzu — spróbuj ponownie lub zapisz szkic.'; $('#form-error-summary').hidden = false; publishing = false; $('#next-step').disabled = false; }
});
updateSummary();
if (restored) $('#draft-status').textContent = 'Przywrócono Twój lokalny szkic.';
const published = new URLSearchParams(location.search).get('published');
const previousJob = published ? getJobs().find(job => job.id === published && job.local) : null;
if (previousJob) showPublished(previousJob);
else if (restored?.step > 1) { const target = restored.step; if (!Object.keys(validateDraft(values(), 1)).length && (target === 2 || !Object.keys(validateDraft(values(), 2)).length)) showStep(target, { focus: false }); }
