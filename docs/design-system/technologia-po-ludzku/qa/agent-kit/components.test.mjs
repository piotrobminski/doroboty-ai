import test from 'node:test';
import assert from 'node:assert/strict';
import { jobs } from '../../jobs.mjs';
import { jobCardMarkup, emptyStateMarkup } from '../../listing-components.mjs';

test('card keeps a stable toggle name while saved state changes and preserves missing salary', () => {
  const job = jobs.find(job => job.min === null);
  const before = jobCardMarkup(job);
  const after = jobCardMarkup(job, { saved: true, headingId: 'second-instance' });
  assert.equal(before.match(/aria-label="Zapisz ofertę:[^"]+"/)[0], after.match(/aria-label="Zapisz ofertę:[^"]+"/)[0]);
  assert.match(after, /aria-pressed="true"/);
  assert.match(after, /aria-labelledby="second-instance"/);
  assert.match(after, /id="second-instance"/);
  assert.match(after, /Widełki niepodane/);
  assert.doesNotMatch(after, />0 zł/);
});

test('rendered content and attribute boundaries are escaped and executable href schemes are rejected', () => {
  const job = { ...jobs[0], id: 'local-" onclick="bad', title: '<img src=x onerror=bad>', company: '<script>bad</script>', tags: ['<svg onload=bad>'] };
  const html = jobCardMarkup(job, { href: 'job.html?id=a&back=%2F' });
  assert.ok(!html.includes('<script>'));
  assert.ok(!html.includes('<img src=x'));
  assert.ok(!html.includes('<svg onload='));
  assert.ok(html.includes('data-save="local-&quot; onclick=&quot;bad"'));
  assert.ok(html.includes('href="job.html?id=a&amp;back=%2F"'));
  for (const href of ['javascript:alert(1)', 'data:text/html,hello', 'https://user:pass@example.com']) assert.throws(() => jobCardMarkup(jobs[0], { href }), TypeError);
});

test('empty saved list and zero filtered results keep different recovery actions', () => {
  assert.match(emptyStateMarkup({ savedOnly: true, savedCount: 0 }), /data-empty-action="browse"/);
  assert.match(emptyStateMarkup({ savedOnly: true, savedCount: 3 }), /data-empty-action="reset"/);
  assert.match(emptyStateMarkup(), /data-empty-action="reset"/);
});
