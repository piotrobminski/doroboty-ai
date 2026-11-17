import { employerMark, defaultIconScheme } from './icon-schemes.mjs';
import { escapeHTML, salaryText, bookmarkSVG } from './job-view.mjs';

const locationSVG = '<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.4" aria-hidden="true"><path d="M15.5 8c0 4-5.5 8-5.5 8S4.5 12 4.5 8a5.5 5.5 0 1 1 11 0Z"/><circle cx="10" cy="8" r="1.7"/></svg>';
const emptySVG = '<svg viewBox="0 0 90 90" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="7" y="25" width="20" height="38" rx="3"/><path d="M13 35h8m-8 7h8m-8 7h4m10-5h10m16 0h10M58 39l5 5-5 5"/><circle cx="45" cy="44" r="8"/><path d="M45 39v10m-5-5h10"/><rect x="63" y="25" width="20" height="38" rx="3"/><path d="M69 35h8m-8 7h8m-8 7h8m-8 7h4"/></svg>';
const dateLabel = value => new Intl.DateTimeFormat('pl-PL', { day: 'numeric', month: 'short', timeZone: 'UTC' }).format(new Date(`${value}T12:00:00Z`));
function safeLink(value) {
  try {
    const url = new URL(value, 'https://example.invalid/');
    if (['http:', 'https:'].includes(url.protocol) && !url.username && !url.password) return value;
  } catch { /* Reject an invalid destination before inserting markup. */ }
  throw new TypeError('Karta oferty wymaga poprawnego linku HTTP(S) lub względnej ścieżki.');
}

/** Pure markup; the caller owns events, state and persistence. See agent-kit/components.md. */
export function jobCardMarkup(job, { saved = false, href = `job.html?id=${encodeURIComponent(job.id)}`, iconScheme = defaultIconScheme, headingId = `title-${job.id}` } = {}) {
  const id = escapeHTML(job.id);
  const titleId = escapeHTML(headingId);
  const basis = job.contract === 'B2B' ? 'netto' : 'brutto';
  const salary = job.min === null ? 'Widełki niepodane' : `${salaryText(job)} <small>${basis} / mies.</small>`;
  return `<article class="job-card${job.featured ? ' featured' : ''}" aria-labelledby="${titleId}">
    <div class="card-top">
      ${employerMark(job, { useLogo: iconScheme !== 'experience' && iconScheme !== 'category' })}
      <div class="card-header"><p class="company-line"><span>${escapeHTML(job.company)}</span><span class="separator" aria-hidden="true"></span><span>${escapeHTML(job.category)}</span></p><h3 id="${titleId}"><a class="job-title-link" data-job-id="${id}" href="${escapeHTML(safeLink(href))}">${escapeHTML(job.title)}</a></h3></div>
      <button class="icon-button save-job" type="button" data-save="${id}" aria-pressed="${Boolean(saved)}" aria-label="Zapisz ofertę: ${escapeHTML(job.title)}">${bookmarkSVG}</button>
    </div>
    <div class="card-facts"><div class="location-facts">${locationSVG}<span>${job.mode === 'Zdalnie' ? 'Zdalnie / Polska' : `${escapeHTML(job.city)} / ${escapeHTML(job.mode.toLocaleLowerCase('pl'))}`}</span><span class="fact-dot" aria-hidden="true">·</span><span>${job.contract === 'UoP' ? 'Umowa o pracę' : 'B2B'}</span></div><span class="salary">${salary}</span></div>
    <div class="card-bottom"><div class="tag-list">${job.tags.map(tag => `<span class="tag">${escapeHTML(tag)}</span>`).join('')}${job.featured ? '<span class="tag tag-featured">Wyróżniona oferta</span>' : ''}</div><time class="card-date" datetime="${escapeHTML(job.posted)}" aria-label="Opublikowano ${dateLabel(job.posted)}">${dateLabel(job.posted)}</time></div>
  </article>`;
}

export function emptyStateMarkup({ savedOnly = false, savedCount = 0 } = {}) {
  const noSaved = savedOnly && savedCount === 0;
  return `<div class="empty-state"><div class="empty-graphic">${emptySVG}</div><p class="eyebrow">${noSaved ? 'Twoja lista, Twój kierunek' : '0 ofert dla tych filtrów'}</p><h3>${noSaved ? 'Dobre oferty warto<br>mieć pod ręką.' : 'Nie znaleźliśmy<br>takiego połączenia.'}</h3><p>${noSaved ? 'Zapisz interesujące Cię role ikoną zakładki. Tutaj łatwo do nich wrócisz.' : 'Spróbuj poszerzyć lokalizację lub zmienić wybrane kryteria. Twój następny krok może być tuż obok.'}</p><button class="button button-dark" type="button" data-empty-action="${noSaved ? 'browse' : 'reset'}">${noSaved ? 'Przeglądaj oferty' : 'Wyczyść filtry'} <span aria-hidden="true">↗</span></button></div>`;
}
