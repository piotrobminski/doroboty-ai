import { jobs as exampleJobs } from './jobs.mjs';

export const draftKey = 'doroboty-offer-draft-v1';
export const publishedKey = 'doroboty-local-offers-v1';
export const emptyDraft = { title: '', company: 'Forma Lab', category: 'Apply', level: '', city: 'Warszawa', mode: 'Hybrydowo', contract: 'B2B', salaryMin: '', salaryMax: '', salaryHidden: false, skills: '', summary: '', responsibilities: '', requirements: '', benefits: '', companyAbout: '', aiContext: '', applicationUrl: '' };
const areas = ['Build', 'Apply', 'Lead'];
const levels = ['Junior', 'Mid', 'Senior', 'Lead'];
const modes = ['Zdalnie', 'Hybrydowo', 'Stacjonarnie'];
export function browserStorage() { try { return window.localStorage; } catch { return null; } }
const read = (key, fallback, storage) => { try { return JSON.parse(storage?.getItem(key) || 'null') ?? fallback; } catch { return fallback; } };
const lines = value => String(value || '').split('\n').map(line => line.trim().replace(/^[•\-]\s*/, '')).filter(Boolean);
export function safeApplicationURL(value) {
  if (!value) return '';
  try { const url = new URL(value); return ['https:', 'http:'].includes(url.protocol) && !url.username && !url.password ? url.href : ''; } catch { return ''; }
}
export function validateDraft(v, step) {
  const errors = {};
  if (!step || step === 1) {
    if (String(v.title || '').trim().length < 4) errors.title = 'Wpisz nazwę stanowiska (co najmniej 4 znaki).';
    if (String(v.company || '').trim().length < 2) errors.company = 'Podaj nazwę firmy.';
    if (!areas.includes(v.category)) errors.category = 'Wybierz obszar pracy.';
    if (!levels.includes(v.level)) errors.level = 'Wybierz wymagany poziom doświadczenia.';
    if (!modes.includes(v.mode)) errors.mode = 'Wybierz tryb pracy.';
    if (!['B2B', 'UoP'].includes(v.contract)) errors.contract = 'Wybierz formę współpracy.';
    if (v.mode !== 'Zdalnie' && String(v.city || '').trim().length < 2) errors.city = 'Podaj miasto pracy stacjonarnej lub hybrydowej.';
    if (!v.salaryHidden) {
      if (!String(v.salaryMin).trim() || !Number.isFinite(Number(v.salaryMin)) || Number(v.salaryMin) <= 0) errors.salaryMin = 'Podaj dolną granicę wynagrodzenia większą od zera.';
      if (!String(v.salaryMax).trim() || !Number.isFinite(Number(v.salaryMax)) || Number(v.salaryMax) <= 0) errors.salaryMax = 'Podaj górną granicę wynagrodzenia większą od zera.';
      else if (!errors.salaryMin && Number(v.salaryMax) < Number(v.salaryMin)) errors.salaryMax = 'Górna granica nie może być niższa od dolnej.';
    }
    if (String(v.skills || '').split(',').filter(x => x.trim()).length > 5) errors.skills = 'Podaj maksymalnie 5 umiejętności.';
  }
  if (!step || step === 2) {
    if (String(v.summary || '').trim().length < 60) errors.summary = 'Opisz rolę w co najmniej 60 znakach.';
    if (!lines(v.responsibilities).length) errors.responsibilities = 'Dodaj co najmniej jeden obowiązek.';
    if (!lines(v.requirements).length) errors.requirements = 'Dodaj co najmniej jedno wymaganie.';
    if (v.applicationUrl && !safeApplicationURL(v.applicationUrl)) errors.applicationUrl = 'Podaj poprawny adres zaczynający się od https:// lub http://.';
  }
  return errors;
}
export function draftToJob(values, { id = 'draft-preview', posted = new Date().toISOString().slice(0, 10) } = {}) {
  if (Object.keys(validateDraft(values)).length) throw new Error('Uzupełnij wymagane dane oferty.');
  const v = Object.fromEntries(Object.keys(emptyDraft).map(key => [key, typeof values[key] === 'string' ? values[key].trim() : values[key]]));
  return { id, title: v.title, company: v.company, initials: v.company.split(/\s+/).slice(0, 2).map(word => word[0]).join('').toUpperCase(), category: v.category, level: v.level, city: v.city || 'Polska', mode: v.mode, contract: v.contract, min: v.salaryHidden ? null : Number(v.salaryMin), max: v.salaryHidden ? null : Number(v.salaryMax), tags: [v.level, ...String(v.skills || '').split(',').map(x => x.trim()).filter(Boolean)], intro: v.summary, tasks: lines(v.responsibilities), requirements: lines(v.requirements), benefits: lines(v.benefits), companyAbout: v.companyAbout, aiContext: v.aiContext, applicationUrl: safeApplicationURL(v.applicationUrl), posted, featured: false, local: true };
}
function validLocalJob(j) {
  return j && typeof j.id === 'string' && j.id.startsWith('local-') && typeof j.title === 'string' && typeof j.company === 'string' && typeof j.initials === 'string' && areas.includes(j.category) && levels.includes(j.level) && modes.includes(j.mode) && ['B2B', 'UoP'].includes(j.contract) && typeof j.city === 'string' && typeof j.intro === 'string' && typeof j.posted === 'string' && [j.tasks, j.requirements, j.tags].every(a => Array.isArray(a) && a.every(s => typeof s === 'string')) && ((j.min === null && j.max === null) || (Number.isFinite(j.min) && Number.isFinite(j.max) && j.min > 0 && j.max >= j.min));
}
export function getJobs(storage = browserStorage()) {
  const stored = read(publishedKey, [], storage);
  const local = Array.isArray(stored) ? stored.filter(validLocalJob).map(job => ({ ...job, local: true, applicationUrl: safeApplicationURL(job.applicationUrl) })) : [];
  return [...local, ...exampleJobs];
}
export function getDraft(storage = browserStorage()) {
  const draft = read(draftKey, null, storage);
  if (!draft || typeof draft.values !== 'object' || !draft.values) return null;
  const values = { ...emptyDraft };
  for (const key of Object.keys(values)) if (typeof draft.values[key] === typeof values[key]) values[key] = draft.values[key];
  return { values, step: [1, 2, 3].includes(draft.step) ? draft.step : 1, updatedAt: draft.updatedAt };
}
export function saveDraft(values, step, storage = browserStorage()) {
  if (!storage) throw new Error('Pamięć przeglądarki jest niedostępna.');
  storage.setItem(draftKey, JSON.stringify({ values, step, updatedAt: new Date().toISOString() }));
}
export function publishJob(job, storage = browserStorage()) {
  if (!validLocalJob(job)) throw new Error('Oferta ma niepoprawne dane.');
  if (!storage) throw new Error('Pamięć przeglądarki jest niedostępna.');
  const local = getJobs(storage).filter(item => item.local && item.id !== job.id);
  storage.setItem(publishedKey, JSON.stringify([job, ...local]));
  try { storage.removeItem(draftKey); } catch { /* The published record is already durable. */ }
  return job;
}
