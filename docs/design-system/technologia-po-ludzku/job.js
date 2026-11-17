import { getJobs, getDraft, draftToJob, safeApplicationURL } from './job-store.mjs';
import { offerMarkup } from './job-view.mjs';

const $ = selector => document.querySelector(selector);
const params = new URLSearchParams(location.search);
const jobs = getJobs();
const preview = params.get('preview') === 'draft';
let job;
try { job = preview ? draftToJob(getDraft()?.values || {}) : jobs.find(item => item.id === (params.get('id') || 'forma-ai-product-designer')); } catch { job = null; }
function listURL() {
  try { const url = new URL(params.get('back') || './#offers', location.href); if (url.origin === location.origin && ['/', '/index.html'].includes(url.pathname)) return url.pathname + url.search + '#offers'; } catch { /* Use the safe default. */ }
  return './#offers';
}
document.querySelectorAll('#back-to-list, .back-to-list-link').forEach(link => { link.href = listURL(); });
if (!job) {
  $('#offer-content').innerHTML = '<div class="empty-state"><p class="eyebrow">Oferta niedostępna</p><h1>Ten kierunek<br>jest chwilowo poza mapą.</h1><p>Nie znaleźliśmy tej oferty. Wróć do listy i sprawdź pozostałe role.</p><a class="button button-dark" href="./#offers">Przeglądaj oferty ↗</a></div>';
} else {
  document.title = `${job.title} — ${job.company} · DoRoboty.ai`;
  $('#offer-content').innerHTML = `${preview ? '<div class="preview-banner"><span>Podgląd oferty — jeszcze nieopublikowana</span><a href="create-job.html">Wróć do edycji ↗</a></div>' : ''}${offerMarkup(job, { preview })}`;
  $('#offer-breadcrumb-context').textContent = `${job.category} / ${job.company}`;
  $('#application-company').textContent = `${job.company} / ${job.title}`;
}

let toastTimer;
function toast(text) { clearTimeout(toastTimer); $('#toast').textContent = text; $('#toast').classList.add('visible'); toastTimer = setTimeout(() => $('#toast').classList.remove('visible'), 3200); }
const savedKey = 'doroboty-tph-saved-v1';
let memorySaved = null;
function getSaved() { if (memorySaved) return memorySaved; try { const ids = JSON.parse(localStorage.getItem(savedKey) || '[]'); return Array.isArray(ids) ? ids.filter(id => typeof id === 'string') : []; } catch { return []; } }
function updateSaved() { const button = $('[data-save-offer]'); if (!button || !job) return; const saved = getSaved().includes(job.id); button.setAttribute('aria-pressed', String(saved)); button.setAttribute('aria-label', `Zapisz ofertę: ${job.title}`); button.querySelector('span').textContent = 'Zapisz na później'; }
updateSaved();
$('[data-save-offer]')?.addEventListener('click', () => { const ids = new Set(getSaved()); ids.has(job.id) ? ids.delete(job.id) : ids.add(job.id); try { localStorage.setItem(savedKey, JSON.stringify([...ids])); memorySaved = null; toast(ids.has(job.id) ? 'Oferta zapisana. Wrócisz do niej na liście zapisanych.' : 'Usunięto z zapisanych.'); } catch { memorySaved = [...ids]; toast('Zmiana zachowana tylko do zamknięcia tej strony.'); } updateSaved(); });

const dialog = $('#application-dialog');
const form = $('#application-form');
let applicationOpener;
document.addEventListener('click', event => {
  if (event.target.closest('[data-apply]')) { applicationOpener = event.target.closest('[data-apply]'); $('#application-form-view').hidden = false; $('#application-success').hidden = true; dialog.showModal(); }
  if (event.target.closest('[data-close-application]')) dialog.close();
});
dialog.addEventListener('click', event => { const r = dialog.getBoundingClientRect(); if (event.target === dialog && (event.clientX < r.left || event.clientX > r.right || event.clientY < r.top || event.clientY > r.bottom)) dialog.close(); });
function error(id, message = '') { const field = document.getElementById(id); field.setAttribute('aria-invalid', String(Boolean(message))); const output = document.getElementById(`${id}-error`); if (output) output.textContent = message; }
form.addEventListener('input', event => { if (event.target.id) error(event.target.id); });
form.addEventListener('change', event => { if (event.target.id) error(event.target.id); });
form.addEventListener('submit', event => {
  event.preventDefault();
  const errors = {};
  if ($('#candidate-name').value.trim().length < 2) errors['candidate-name'] = 'Podaj imię i nazwisko.';
  if (!$('#candidate-email').value.trim() || !$('#candidate-email').validity.valid) errors['candidate-email'] = 'Podaj poprawny adres e-mail.';
  const link = $('#candidate-link').value.trim();
  const file = $('#candidate-file').files[0];
  if (link && !safeApplicationURL(link)) errors['candidate-link'] = 'Podaj poprawny adres zaczynający się od https:// lub http://.';
  if (!link && !file) errors['candidate-link'] = 'Dodaj link do swojego profilu, CV lub portfolio albo dołącz plik.';
  if (file && (!/\.(pdf|docx?)$/i.test(file.name) || file.size > 5 * 1024 * 1024)) errors['candidate-file'] = 'Wybierz plik PDF, DOC lub DOCX do 5 MB.';
  for (const id of ['candidate-name', 'candidate-email', 'candidate-link', 'candidate-file']) error(id, errors[id]);
  if (Object.keys(errors).length) { document.getElementById(Object.keys(errors)[0]).focus(); return; }
  form.reset();
  $('#application-form-view').hidden = true;
  $('#application-success').hidden = false;
  $('#application-success').focus();
});
dialog.addEventListener('close', () => { form.reset(); for (const id of ['candidate-name', 'candidate-email', 'candidate-link', 'candidate-file']) error(id); applicationOpener?.focus({ preventScroll: true }); });
