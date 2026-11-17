import test from 'node:test';
import assert from 'node:assert/strict';
import { emptyDraft, validateDraft, draftToJob, getDraft, saveDraft, getJobs, publishJob, safeApplicationURL, draftKey, publishedKey } from '../../job-store.mjs';
import { offerMarkup } from '../../job-view.mjs';

const valid = { ...emptyDraft, title: 'AI Product Designer', level: 'Mid', salaryMin: '18000', salaryMax: '24000', summary: 'Projektuj narzędzia, które pomagają ludziom świadomie pracować z AI i rozwiązywać codzienne problemy.', responsibilities: 'Badania z użytkownikami\nProjektowanie prototypów', requirements: 'Doświadczenie w projektowaniu', skills: 'Figma, UX research' };
const storage = () => { const data = new Map(); return { getItem: key => data.get(key) ?? null, setItem: (key, value) => data.set(key, String(value)), removeItem: key => data.delete(key) }; };

test('an incomplete draft survives a reload without publishing a job', () => {
  const s = storage(); saveDraft({ ...emptyDraft, title: 'Nowa rola' }, 1, s);
  assert.equal(getDraft(s).values.title, 'Nowa rola');
  assert.equal(getJobs(s).length, 12);
});
test('salary bounds reject reversal while undisclosed salary becomes null', () => {
  assert.ok(validateDraft({ ...valid, salaryMax: '17000' }, 1).salaryMax);
  assert.throws(() => draftToJob({ ...valid, salaryMax: '17000' }));
  const j = draftToJob({ ...valid, salaryHidden: true, salaryMin: '', salaryMax: '' });
  assert.equal(j.min, null); assert.equal(j.max, null);
});
test('publish persists the candidate record, clears the draft, and does not duplicate an id', () => {
  const s = storage(); saveDraft(valid, 3, s);
  const j = draftToJob(valid, { id: 'local-test', posted: '2026-11-13' });
  publishJob(j, s); publishJob(j, s);
  assert.equal(getJobs(s).length, 13);
  assert.equal(getJobs(s)[0].title, valid.title);
  assert.equal(getJobs(s)[0].tasks.length, 2);
  assert.equal(s.getItem(draftKey), null);
});
test('unavailable storage does not report a successful publication', () => {
  const j = draftToJob(valid, { id: 'local-test' });
  assert.throws(() => publishJob(j, null));
  assert.throws(() => publishJob(j, { getItem: () => null, setItem: () => { throw new Error('Quota'); } }));
});
test('malformed local records do not break the base listing', () => {
  const s = storage(); s.setItem(publishedKey, JSON.stringify([{ id: 'local-broken', title: 'Partial' }]));
  assert.equal(getJobs(s).length, 12);
});
test('external application links accept only plain http(s) destinations', () => {
  assert.equal(safeApplicationURL('javascript:alert(1)'), '');
  assert.equal(safeApplicationURL('https://person:password@example.com'), '');
  assert.equal(safeApplicationURL('https://example.com/jobs'), 'https://example.com/jobs');
});
test('candidate and recruiter preview render entered content as text', () => {
  const j = draftToJob({ ...valid, title: '<script>alert(1)</script>', responsibilities: '<img src=x onerror=alert(1)>' });
  const html = offerMarkup(j, { preview: true });
  assert.ok(html.includes('&lt;script&gt;'));
  assert.ok(!html.includes('<script>'));
  assert.ok(!html.includes('<img src=x'));
});
