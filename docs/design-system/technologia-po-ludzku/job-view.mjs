import { employerMark, areaSVG, areaLabels } from './icon-schemes.mjs';
import { safeApplicationURL } from './job-store.mjs';

export const escapeHTML = value => String(value ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
export const bookmarkSVG = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><path d="M6 4.5h12v16L12 16l-6 4.5z"/></svg>';
const number = value => new Intl.NumberFormat('pl-PL', { maximumFractionDigits: 0 }).format(value);
export function salaryText(job) { return job.min === null ? 'Widełki niepodane' : `${number(job.min)}–${number(job.max)} zł`; }
export function salaryBasis(job) { return job.min === null ? 'Zapytaj firmę o wynagrodzenie' : `${job.contract === 'B2B' ? 'netto' : 'brutto'} / miesiąc · ${job.contract === 'B2B' ? 'B2B' : 'umowa o pracę'}`; }
const sampleExtras = {
  benefits: ['Realny wpływ na produkt, od pierwszego szkicu po wdrożenie.', 'Budżet na rozwój i przestrzeń na eksperymenty z AI.', 'Elastyczne godziny pracy i współpraca w małym zespole.', 'Regularna wymiana wiedzy między designem, badaniami i inżynierią.'],
  companyAbout: 'Forma Lab to fikcyjny zespół projektantów, badaczy i inżynierów. Tworzymy narzędzia, które pomagają ludziom świadomie korzystać z technologii. Cenimy jasną komunikację, ciekawość i wspólne szukanie rozwiązań.',
  aiContext: 'Projektujesz współpracę człowieka z modelem: kontrolę, informację zwrotną i zrozumiałe ograniczenia. Nie musisz trenować modeli — ważne, żeby rozumieć ich wpływ na doświadczenie użytkownika.',
  process: ['Poznajmy się', 'Porozmawiajmy o projektowaniu', 'Podejmijmy wspólną decyzję']
};
const paragraphs = text => String(text || '').split(/\n\s*\n/).map(p => `<p>${escapeHTML(p).replace(/\n/g, '<br>')}</p>`).join('');
const bullets = items => `<ul class="offer-bullets">${items.map(item => `<li>${escapeHTML(item)}</li>`).join('')}</ul>`;
export function offerMarkup(job, { preview = false } = {}) {
  const extra = job.id === 'forma-ai-product-designer' ? sampleExtras : {};
  const benefits = job.benefits?.length ? job.benefits : extra.benefits || [];
  const companyAbout = job.companyAbout || extra.companyAbout || '';
  const aiContext = job.aiContext || extra.aiContext || '';
  const applyURL = safeApplicationURL(job.applicationUrl);
  const apply = preview ? '<span class="button button-lime preview-action">Aplikuj na tę ofertę <span aria-hidden="true">↗</span></span>' : applyURL ? `<a class="button button-lime" href="${escapeHTML(applyURL)}" target="_blank" rel="noopener noreferrer">Aplikuj na tę ofertę <span aria-hidden="true">↗</span></a>` : '<button class="button button-lime" type="button" data-apply>Aplikuj na tę ofertę <span aria-hidden="true">↗</span></button>';
  return `<article class="offer-page" data-icon-scheme="marker">
    <header class="offer-hero"><div class="offer-hero-copy"><div class="offer-company">${employerMark(job)}<div><p class="offer-company-name">${escapeHTML(job.company)}</p><p class="offer-company-location">${escapeHTML(job.city)} · ${escapeHTML(job.mode)}</p></div></div><h1>${escapeHTML(job.title)}</h1><div class="offer-hero-tags"><span class="area-label tone-area-${job.category}">${areaSVG(job.category)}${job.category}<span class="area-label-description">/ ${areaLabels[job.category]}</span></span><span>${escapeHTML(job.level)}</span><span>${job.contract === 'UoP' ? 'Umowa o pracę' : 'B2B'}</span></div><div class="offer-mobile-apply"><span class="mobile-salary">${salaryText(job)}<small>${salaryBasis(job)}</small></span>${apply}</div></div><div class="offer-hero-diagram" aria-hidden="true">${areaSVG(job.category)}<span>LUDZIE × TECHNOLOGIA</span></div></header>
    <div class="offer-layout"><div class="offer-main"><dl class="offer-facts"><div><dt>Wynagrodzenie</dt><dd>${salaryText(job)}<small>${salaryBasis(job)}</small></dd></div><div><dt>Tryb pracy</dt><dd>${escapeHTML(job.mode)}<small>${job.mode === 'Zdalnie' ? 'Zdalnie / Polska' : escapeHTML(job.city)}</small></dd></div><div><dt>Doświadczenie</dt><dd>${escapeHTML(job.level)}<small>${job.contract === 'UoP' ? 'Umowa o pracę' : 'Kontrakt B2B'}</small></dd></div></dl>
      <section class="offer-section" id="about-role"><span class="section-index">01 / TWOJA ROLA</span><h2>Praca z sensem.<br>Miejsce na Twój wpływ.</h2><div class="offer-intro">${paragraphs(job.intro)}</div></section>
      ${aiContext ? `<aside class="ai-context"><span class="eyebrow">AI w tej roli</span>${paragraphs(aiContext)}</aside>` : ''}
      <section class="offer-section" id="responsibilities"><span class="section-index">02 / NA CO DZIEŃ</span><h2>Co będziesz robić</h2>${bullets(job.tasks)}</section>
      <section class="offer-section" id="requirements"><span class="section-index">03 / TWÓJ WKŁAD</span><h2>Co wniesiesz do zespołu</h2>${bullets(job.requirements)}</section>
      ${benefits.length ? `<section class="offer-section" id="benefits"><span class="section-index">04 / OD NAS</span><h2>Co dostajesz w zamian</h2>${bullets(benefits)}</section>` : ''}
      ${job.tags?.length > 1 ? `<section class="offer-skills"><h2>Twój warsztat</h2><div class="tag-list">${job.tags.filter(tag => tag !== job.level).map(tag => `<span class="tag">${escapeHTML(tag)}</span>`).join('')}</div></section>` : ''}
      ${extra.process ? `<section class="offer-section hiring-process"><span class="section-index">POZNAJMY SIĘ</span><h2>Od pierwszej rozmowy<br>do wspólnego kierunku.</h2><ol>${extra.process.map((stage, i) => `<li><span>0${i + 1}</span><strong>${stage}</strong></li>`).join('')}</ol></section>` : ''}
      <section class="offer-section offer-company-about"><span class="section-index">ZA OFERTĄ STOJĄ LUDZIE</span><div class="offer-company-heading">${employerMark(job)}<h2>${escapeHTML(job.company)}</h2></div>${companyAbout ? paragraphs(companyAbout) : '<p>Firma nie dodała jeszcze opisu zespołu.</p>'}</section>
    </div><aside class="offer-sidebar"><div class="application-card"><p class="eyebrow">${job.category} / ${escapeHTML(job.company)}</p><h2>Brzmi jak<br> Twój kierunek?</h2><p>Sprawdź warunki i pokaż nam, co potrafisz. Zrób kolejny krok po swojemu.</p><div class="application-salary"><strong>${salaryText(job)}</strong><span>${salaryBasis(job)}</span></div>${apply}${!preview ? `<button class="button button-outline offer-save" type="button" data-save-offer aria-pressed="false">${bookmarkSVG}<span>Zapisz na później</span></button>` : ''}<p class="application-note">${preview ? 'Tak kandydat zobaczy Twoją ofertę.' : applyURL ? 'Przejdziesz do formularza pracodawcy.' : 'Formularz demo — bez wysyłania danych do firmy.'}</p><div class="application-card-footer"><span aria-hidden="true">↗</span> AI w roli. Człowiek w centrum.</div></div><div class="offer-context-note"><span class="eyebrow">${job.local ? 'LOKALNY PODGLĄD' : 'WERSJA DEMONSTRACYJNA'}</span><p>${job.local ? 'Ta oferta została utworzona w tej przeglądarce.' : 'Przykładowa oferta fikcyjnej firmy.'}</p></div></aside></div>
  </article>`;
}
