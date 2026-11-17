export const areaLabels = { Build: 'Buduj AI', Apply: 'Używaj AI w pracy', Lead: 'Prowadź zmianę' };
export const areaSymbols = {
  Build: '<rect x="2.5" y="3" width="5" height="5" rx="1"/><rect x="12.5" y="12" width="5" height="5" rx="1"/><path d="M7.5 5.5H15v6.5"/>',
  Apply: '<path d="M10 2.5v15M2.5 10h15M4.7 4.7l10.6 10.6M4.7 15.3 15.3 4.7"/>',
  Lead: '<circle cx="10" cy="10" r="2.5"/><circle cx="3" cy="3" r="1.5"/><circle cx="17" cy="3" r="1.5"/><circle cx="3" cy="17" r="1.5"/><circle cx="17" cy="17" r="1.5"/><path d="m4.2 4.2 4 4m3.6 0 4-4m-11.6 11.6 4-4m3.6 0 4 4"/>'
};
export const levelNames = ['Junior', 'Mid', 'Senior', 'Lead'];
export const iconSchemeNames = { neutral: 'Neutralne znaki firm', experience: 'Poziom doświadczenia', category: 'Obszar pracy', marker: 'Neutralna firma + znacznik obszaru' };
export const defaultIconScheme = 'marker';
const employerLogos = {
  'Forma Lab': 'forma-lab.svg',
  'Neuron Studio': 'neuron-studio.svg',
  'Nowy Wymiar': 'nowy-wymiar.svg',
  'Punkt Studio': 'punkt-studio.svg',
  'Warstwa': 'warstwa.svg',
  'Jutro Works': 'jutro-works.svg',
  'Splot Digital': 'splot-digital.svg',
  'Obieg': 'obieg.svg',
  'Sygnał': 'sygnal.svg',
  'Horyzont Labs': 'horyzont-labs.svg',
  'Kontekst': 'kontekst.svg',
  'Wektor AI': 'wektor-ai.svg'
};
const escapeHTML = (value) => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

export function areaSVG(area) {
  return `<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${areaSymbols[area] || ''}</svg>`;
}

export function employerMark(job, { useLogo = true } = {}) {
  const area = Object.hasOwn(areaLabels, job.category) ? job.category : '';
  const level = levelNames.includes(job.level) ? job.level : '';
  const logo = useLogo && Object.hasOwn(employerLogos, job.company) ? employerLogos[job.company] : null;
  const identity = logo ? `<img class="employer-logo" src="assets/employers/${logo}" width="28" height="28" alt="" decoding="async">` : escapeHTML(job.initials);
  return `<span class="employer-mark" aria-hidden="true"><span class="employer-icon${logo ? ' has-logo' : ''}" data-company="${escapeHTML(job.company)}" data-area="${area}" data-level="${level}" title="${escapeHTML(`Logo firmy ${job.company}`)}">${identity}</span><span class="area-marker tone-area-${area}">${areaSVG(area)}</span></span>`;
}

export function schemeLegend(scheme) {
  const experience = scheme === 'experience';
  const names = experience ? levelNames : Object.keys(areaLabels);
  return `${scheme === 'marker' ? '<span class="employer-identity-label">Duży znak: logo firmy</span>' : ''}<span class="icon-legend-label">${experience ? 'Doświadczenie' : scheme === 'marker' ? 'Mały znacznik: obszar pracy' : 'Obszar pracy'}</span>${names.map(name => `<span class="icon-legend-item"><span class="legend-swatch tone-${experience ? 'level' : 'area'}-${name}" aria-hidden="true">${!experience && scheme === 'marker' ? areaSVG(name) : ''}</span>${name}</span>`).join('')}`;
}
