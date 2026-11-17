import { jobs } from '../jobs.mjs';
import { jobCardMarkup, emptyStateMarkup } from '../listing-components.mjs';
import { areaLabels, areaSVG, schemeLegend } from '../icon-schemes.mjs';
import { emptyDraft, validateDraft } from '../job-store.mjs';
import { keepDialogFocus } from './dialog.mjs';
import { longContentJob } from './fixtures.mjs';

const $ = selector => document.querySelector(selector);
// Only memory: this gallery never reads or changes the product's localStorage.
const saved = new Set();
const selectedJobs = [...jobs.slice(0, 3), longContentJob];
let noticeTimer;
function notify(text) { clearTimeout(noticeTimer); $('#toast').textContent = text; $('#toast').classList.add('visible'); noticeTimer = setTimeout(() => $('#toast').classList.remove('visible'), 3200); }
$('#kit-legend').innerHTML = schemeLegend('marker');
$('#area-examples').innerHTML = Object.keys(areaLabels).map(area => `<span class="area-label tone-area-${area}">${areaSVG(area)}${area} / ${areaLabels[area]}</span>`).join('');
function renderCards(container, prefix) {
  container.innerHTML = selectedJobs.map(job => jobCardMarkup(job, { saved: saved.has(job.id), headingId: `${prefix}-${job.id}`, href: job.id === longContentJob.id ? 'ui-long-content.html' : `job.html?id=${encodeURIComponent(job.id)}` })).join('');
}
renderCards($('#kit-job-list'), 'gallery');
function updateSaveButtons() {
  document.querySelectorAll('[data-save]').forEach(button => button.setAttribute('aria-pressed', String(saved.has(button.dataset.save))));
}
document.addEventListener('click', event => {
  const button = event.target.closest('[data-save]');
  if (button) { const id = button.dataset.save; saved.has(id) ? saved.delete(id) : saved.add(id); updateSaveButtons(); notify(saved.has(id) ? 'Zapisano w pamięci tego przykładu.' : 'Usunięto z pamięci tego przykładu.'); }
  if (event.target.closest('[data-demo-notice]')) notify('Akcja działa. Pozostań przy swoim zadaniu.');
});
const form = $('#example-form');
const formFields = ['title', 'company', 'level', 'city', 'salaryMin', 'salaryMax'];
function values() { const v = { ...emptyDraft }; for (const name of ['title', 'company', 'category', 'level', 'mode', 'city', 'contract', 'salaryMin', 'salaryMax']) v[name] = form.elements.namedItem(name).value; v.salaryHidden = form.elements.namedItem('salaryHidden').checked; return v; }
function setError(name, message = '') { const control = document.getElementById(`ex-${name}`); const output = document.getElementById(`ex-${name}-error`); control?.setAttribute('aria-invalid', String(Boolean(message))); if (output) output.textContent = message; }
function syncFields() {
  const v = values();
  for (const name of ['salaryMin', 'salaryMax']) { form.elements.namedItem(name).disabled = v.salaryHidden; if (v.salaryHidden) setError(name); }
  $('#example-basis').textContent = v.contract === 'B2B' ? 'Netto / B2B' : 'Brutto / umowa o pracę';
  $('#ex-city').required = v.mode !== 'Zdalnie';
  $('#ex-city-label').innerHTML = v.mode === 'Zdalnie' ? 'Siedziba firmy <span class="optional-label">opcjonalnie</span>' : 'Miasto <span aria-hidden="true">*</span>';
  $('#ex-summary-count').textContent = `${$('#ex-summary').value.length} / 1200`;
}
form.addEventListener('input', event => { if (event.target.name) setError(event.target.name); $('#example-form-status').textContent = ''; syncFields(); });
form.addEventListener('change', syncFields);
form.addEventListener('submit', event => {
  event.preventDefault();
  const errors = validateDraft(values(), 1);
  const file = $('#ex-file').files[0];
  if (file && (!/\.(pdf|docx?)$/i.test(file.name) || file.size > 5 * 1024 * 1024)) errors.file = 'Wybierz PDF, DOC lub DOCX do 5 MiB.';
  for (const name of [...formFields, 'file']) setError(name, errors[name]);
  const invalid = Object.keys(errors).length > 0;
  $('#example-errors').hidden = !invalid;
  $('#example-errors').textContent = invalid ? 'Sprawdź zaznaczone pola — dane pozostają w formularzu.' : '';
  $('#example-form-status').textContent = invalid ? '' : 'Podstawy roli są poprawne. To przykład — niczego nie zapisano ani nie wysłano.';
  if (invalid) document.getElementById(`ex-${Object.keys(errors)[0]}`)?.focus();
});
syncFields();
const dialog = $('#example-dialog');
keepDialogFocus(dialog);
let opener;
$('#open-demo-dialog').addEventListener('click', event => { opener = event.currentTarget; dialog.showModal(); });
dialog.querySelectorAll('[data-close-demo]').forEach(button => button.addEventListener('click', () => dialog.close()));
dialog.addEventListener('close', () => { $('#dialog-note').value = ''; opener?.focus({ preventScroll: true }); });
dialog.addEventListener('click', event => { if (event.target !== dialog) return; const r = dialog.getBoundingClientRect(); if (event.clientX < r.left || event.clientX > r.right || event.clientY < r.top || event.clientY > r.bottom) dialog.close(); });
const stepNames = ['Podstawy', 'Opis oferty', 'Podgląd'];
document.querySelectorAll('[data-example-step]').forEach(button => button.addEventListener('click', () => {
  const current = Number(button.dataset.exampleStep);
  document.querySelectorAll('[data-example-step]').forEach(item => { const step = Number(item.dataset.exampleStep); if (step === current) item.setAttribute('aria-current', 'step'); else item.removeAttribute('aria-current'); item.classList.toggle('completed', step < current); });
  $('#example-step-status').textContent = `Bieżący etap: ${stepNames[current - 1]}.`;
}));
function showEmpty(savedOnly = false) { $('#example-empty').innerHTML = emptyStateMarkup({ savedOnly, savedCount: 0 }); $('#empty-example-status').textContent = ''; }
$('#show-empty-results').addEventListener('click', () => showEmpty(false));
$('#show-empty-saved').addEventListener('click', () => showEmpty(true));
$('#example-empty').addEventListener('click', event => {
  if (!event.target.closest('[data-empty-action]')) return;
  $('#example-empty').innerHTML = '<div class="job-list"></div>';
  renderCards($('#example-empty .job-list'), 'recovery');
  $('#empty-example-status').textContent = 'Wróciliśmy do przykładowych ofert.';
  $('#example-empty .job-title-link').focus({ preventScroll: true });
});
showEmpty();
