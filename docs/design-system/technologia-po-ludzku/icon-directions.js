import { jobs } from './jobs.mjs';
import { employerMark, schemeLegend } from './icon-schemes.mjs';

const ids = ['sygnal-junior-data-scientist', 'forma-ai-product-designer', 'neuron-senior-ai-engineer', 'nowy-wymiar-transformation-lead'];
const samples = ids.map(id => jobs.find(job => job.id === id));
const escapeHTML = (value) => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function sample(job, useLogo = false) {
  return `<article class="sample-card"><div class="sample-card-top">${employerMark(job, { useLogo })}<div><p class="company-line"><span>${escapeHTML(job.company)}</span><span class="separator" aria-hidden="true"></span><span>${job.category}</span></p><h3>${escapeHTML(job.title)}</h3></div></div><div class="sample-card-bottom"><span class="tag sample-level">${job.level}</span><span>${job.mode === 'Zdalnie' ? 'Zdalnie / Polska' : `${escapeHTML(job.city)} / ${job.mode.toLowerCase()}`}</span><span>· ${job.contract === 'UoP' ? 'Umowa o pracę' : 'B2B'}</span></div></article>`;
}
for (const scheme of ['experience', 'category']) {
  document.getElementById(`${scheme}-legend`).innerHTML = schemeLegend(scheme);
  document.getElementById(`${scheme}-samples`).innerHTML = samples.map(job => sample(job)).join('');
}
document.getElementById('marker-legend').innerHTML = schemeLegend('marker');
document.getElementById('marker-samples').innerHTML = [samples[1], samples[2], samples[3]].map(job => sample(job, true)).join('');
