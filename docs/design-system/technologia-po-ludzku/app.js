import { getJobs } from './job-store.mjs';
import { schemeLegend, iconSchemeNames, defaultIconScheme } from './icon-schemes.mjs';
import { jobCardMarkup, emptyStateMarkup } from './listing-components.mjs';

const $ = (selector) => document.querySelector(selector);
const jobs = getJobs();
const locations = [...new Set(jobs.map(job => job.city).filter(city => city && city !== 'Polska'))].sort((a, b) => a.localeCompare(b, 'pl'));
const escapeHTML = (text) => String(text).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const normalize = (text) => text.toLocaleLowerCase('pl').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/ł/g, 'l');
const storageKey = 'doroboty-tph-saved-v1';
let saved = new Set();
let storageAvailable = true;
try {
  const stored = JSON.parse(localStorage.getItem(storageKey) || '[]');
  if (Array.isArray(stored)) saved = new Set(stored.filter((id) => jobs.some((job) => job.id === id)));
} catch { storageAvailable = false; }

const defaults = { query: '', location: '', category: 'all', level: '', contract: '', remote: false, salary: false, savedOnly: false, sort: 'newest' };
const state = { ...defaults };
const params = new URLSearchParams(location.search);
$('#location').innerHTML = '<option value="">Cała Polska</option>' + locations.map(city => `<option>${escapeHTML(city)}</option>`).join('');
const iconScheme = Object.hasOwn(iconSchemeNames, params.get('iconScheme')) ? params.get('iconScheme') : defaultIconScheme;
document.body.dataset.iconScheme = iconScheme;
if (iconScheme !== 'neutral') {
  $('#icon-legend').hidden = false;
  $('#icon-legend').innerHTML = schemeLegend(iconScheme);
}
state.query = (params.get('q') || '').slice(0, 200);
for (const [key, values] of Object.entries({ location: ['', ...locations], category: ['all', 'Build', 'Apply', 'Lead'], level: ['', 'Junior', 'Mid', 'Senior', 'Lead'], contract: ['', 'B2B', 'UoP'], sort: ['newest', 'salary'] })) {
  if (values.includes(params.get(key))) state[key] = params.get(key);
}
for (const key of ['remote', 'salary', 'savedOnly']) state[key] = params.get(key) === '1';

const elements = { query: $('#query'), location: $('#location'), level: $('#level'), contract: $('#contract'), remote: $('#remote'), salary: $('#salary'), sort: $('#sort'), list: $('#job-list'), about: $('#about-dialog') };
const compactLayout = matchMedia('(max-width: 850px)');
const adaptFilters = () => { $('.additional-filters').open = !compactLayout.matches; };
adaptFilters();
compactLayout.addEventListener('change', adaptFilters);
let toastTimeout;

function syncURL() {
  const next = new URL(location.href);
  next.search = '';
  if (iconScheme !== defaultIconScheme) next.searchParams.set('iconScheme', iconScheme);
  for (const [key, value] of Object.entries(state)) {
    if (value !== defaults[key]) next.searchParams.set(key === 'query' ? 'q' : key, typeof value === 'boolean' ? '1' : value);
  }
  history.replaceState(history.state, '', next);
}

function filteredJobs(ignoreCategory = false) {
  const terms = normalize(state.query.trim()).split(/\s+/).filter(Boolean);
  return jobs.filter((job) => {
    const haystack = normalize([job.title, job.company, job.category, job.city, job.mode, ...job.tags].join(' '));
    return terms.every((term) => haystack.includes(term))
      && (ignoreCategory || state.category === 'all' || state.category === job.category)
      && (!state.location || job.city === state.location)
      && (!state.level || job.level === state.level)
      && (!state.contract || job.contract === state.contract)
      && (!state.remote || job.mode === 'Zdalnie')
      && (!state.salary || job.min !== null)
      && (!state.savedOnly || saved.has(job.id));
  }).sort((a, b) => state.sort === 'salary'
    ? (b.max ?? -1) - (a.max ?? -1) || b.posted.localeCompare(a.posted)
    : b.posted.localeCompare(a.posted));
}

function jobURL(id) {
  return `job.html?id=${encodeURIComponent(id)}&back=${encodeURIComponent(`./${location.search}#offers`)}`;
}

function cardHTML(job) {
  return jobCardMarkup(job, { saved: saved.has(job.id), href: jobURL(job.id), iconScheme });
}

function emptyHTML() {
  return emptyStateMarkup({ savedOnly: state.savedOnly, savedCount: saved.size });
}

function activeEntries() {
  return [
    state.query && ['query', `Szukasz: ${state.query}`],
    state.location && ['location', state.location],
    state.category !== 'all' && ['category', state.category],
    state.level && ['level', state.level],
    state.contract && ['contract', state.contract === 'UoP' ? 'Umowa o pracę' : state.contract],
    state.remote && ['remote', 'Praca zdalna'],
    state.salary && ['salary', 'Z widełkami']
  ].filter(Boolean);
}

function render({ updateURL = true } = {}) {
  if (updateURL) syncURL();
  const activeSave = document.activeElement?.dataset.save;
  const result = filteredJobs();
  elements.list.innerHTML = result.length ? result.map(cardHTML).join('') : emptyHTML();
  for (const key of ['query', 'location', 'level', 'contract', 'sort']) if (elements[key].value !== state[key]) elements[key].value = state[key];
  elements.remote.checked = state.remote;
  elements.salary.checked = state.salary;
  $('#saved-count').textContent = saved.size;
  $('#saved-view').setAttribute('aria-label', `Zapisane oferty: ${saved.size}`);
  $('#saved-view').setAttribute('aria-pressed', String(state.savedOnly));
  $('#offers-link').classList.toggle('active', !state.savedOnly);
  $('#results-title').textContent = state.savedOnly ? 'Twoje zapisane oferty.' : 'Znajdź swój kierunek.';
  const number = result.length;
  const noun = number === 1 ? 'oferta' : number >= 2 && number <= 4 ? 'oferty' : 'ofert';
  $('#result-count').textContent = `${number} ${state.savedOnly ? 'zapisanych' : 'przykładowych'} ${noun}`.replace('1 zapisanych oferta', '1 zapisana oferta').replace('1 przykładowych oferta', '1 przykładowa oferta').replace(/([2-4]) zapisanych oferty/, '$1 zapisane oferty').replace(/([2-4]) przykładowych oferty/, '$1 przykładowe oferty');
  const entries = activeEntries();
  $('#active-filters').hidden = !entries.length;
  $('#active-filters').innerHTML = entries.map(([key, label]) => `<button class="active-filter" data-remove-filter="${key}" type="button" aria-label="Usuń filtr: ${escapeHTML(label)}">${escapeHTML(label)}<span aria-hidden="true">×</span></button>`).join('');
  $('#reset-filters').hidden = !entries.length;
  $('#results-end').hidden = !result.length;
  const base = filteredJobs(true);
  document.querySelectorAll('[data-category]').forEach((button) => {
    const selected = button.dataset.category === state.category;
    button.classList.toggle('selected', selected);
    button.setAttribute('aria-pressed', String(selected));
    button.querySelector('.category-count').textContent = button.dataset.category === 'all' ? base.length : base.filter((job) => job.category === button.dataset.category).length;
  });
  if (activeSave) {
    const nextFocus = elements.list.querySelector(`[data-save="${activeSave}"]`) || elements.list.querySelector('[data-empty-action]') || elements.list.querySelector('.job-title-link');
    nextFocus?.focus({ preventScroll: true });
  }
}

function toast(message) {
  clearTimeout(toastTimeout);
  $('#toast').textContent = message;
  $('#toast').classList.add('visible');
  toastTimeout = setTimeout(() => $('#toast').classList.remove('visible'), 3200);
}

function toggleSave(id) {
  const job = jobs.find((item) => item.id === id);
  if (!job) return;
  saved.has(id) ? saved.delete(id) : saved.add(id);
  try { localStorage.setItem(storageKey, JSON.stringify([...saved])); storageAvailable = true; }
  catch { storageAvailable = false; }
  render();
  toast(storageAvailable ? saved.has(id) ? 'Oferta zapisana. Wrócisz do niej w zakładce „Zapisane”.' : 'Oferta usunięta z zapisanych.' : 'Zmiana zachowana tylko do zamknięcia strony — pamięć przeglądarki jest niedostępna.');
}

function resetFilters() {
  const savedOnly = state.savedOnly;
  const sort = state.sort;
  Object.assign(state, defaults, { savedOnly, sort });
  render();
}

function routeHash() {
  if (location.hash.startsWith('#oferta/')) location.replace(jobURL(location.hash.slice(8)));
}

$('#search-form').addEventListener('submit', (event) => { event.preventDefault(); state.query = elements.query.value.slice(0, 200); render(); $('.results').scrollIntoView({ block: 'start', behavior: 'smooth' }); });
elements.query.maxLength = 200;
elements.query.addEventListener('input', () => { state.query = elements.query.value; render(); });
for (const key of ['location', 'level', 'contract', 'sort']) elements[key].addEventListener('change', () => { state[key] = elements[key].value; render(); });
for (const key of ['remote', 'salary']) elements[key].addEventListener('change', () => { state[key] = elements[key].checked; render(); });
document.querySelectorAll('[data-category]').forEach((button) => button.addEventListener('click', () => { state.category = button.dataset.category; render(); }));
$('#reset-filters').addEventListener('click', resetFilters);
$('#saved-view').addEventListener('click', () => { state.savedOnly = !state.savedOnly; render(); $('#offers').scrollIntoView({ block: 'start', behavior: 'smooth' }); });
$('#offers-link').addEventListener('click', () => { state.savedOnly = false; render(); });
$('#active-filters').addEventListener('click', (event) => {
  const button = event.target.closest('[data-remove-filter]');
  if (!button) return;
  state[button.dataset.removeFilter] = defaults[button.dataset.removeFilter];
  render();
  $('#reset-filters').hidden ? elements.query.focus({ preventScroll: true }) : $('#reset-filters').focus({ preventScroll: true });
});
document.addEventListener('click', (event) => {
  const save = event.target.closest('[data-save]');
  if (save) { toggleSave(save.dataset.save); return; }
  const emptyAction = event.target.closest('[data-empty-action]');
  if (emptyAction) { if (emptyAction.dataset.emptyAction === 'browse') state.savedOnly = false; resetFilters(); elements.query.focus({ preventScroll: true }); }
  if (event.target.closest('[data-open-about]') || event.target.closest('#about-button')) elements.about.showModal();
  if (event.target.closest('[data-close-about]')) elements.about.close();
});
for (const dialog of [elements.about]) dialog.addEventListener('click', (event) => {
  if (event.target !== dialog) return;
  const rect = dialog.getBoundingClientRect();
  if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) dialog.close();
});
window.addEventListener('hashchange', routeHash);
render({ updateURL: false });
routeHash();
