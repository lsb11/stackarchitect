import { test } from 'node:test';
import assert from 'node:assert/strict';
import { GET } from '../src/pages/downloads/ios-attribution-gap-benchmark.json.js';
import {
  dataPoints,
  benchmarkMeta,
  retractions,
  EXPORT_VERSION,
  EXPORT_VERSION_DATE,
} from '../src/data/attributionGap.js';

test('JSON export endpoint returns valid JSON with correct structure', async () => {
  const response = GET();
  assert.equal(response.status, 200);
  assert.equal(response.headers.get('Content-Type'), 'application/json; charset=utf-8');

  const text = await response.text();
  const data = JSON.parse(text);

  assert.equal(data.name, benchmarkMeta.name);
  // The retracted 20-40% synthesis was this export's `headline`. Assert it is
  // gone by name: `data.headline === benchmarkMeta.headline` still passed once
  // both sides were undefined, which is a test that had stopped testing.
  assert.ok(!('headline' in data), 'the retracted headline figure must not be exported');
  assert.ok(!('headline' in benchmarkMeta), 'benchmarkMeta carries identity and licence, no figure');

  // The export is versioned so the disappearance of `headline` is legible to an
  // automated consumer rather than looking like a broken payload.
  assert.equal(data.version, EXPORT_VERSION);
  assert.equal(data.versionDate, EXPORT_VERSION_DATE);
  assert.ok(EXPORT_VERSION >= 2, 'v1 was the unversioned shape that carried headline');

  // ...and the retraction has a field of its own to land in.
  assert.deepEqual(data.retractions, retractions);
  const headlineRetraction = data.retractions.find((r) => r.field === 'headline');
  assert.ok(headlineRetraction, 'the withdrawn headline figure must be recorded, not just absent');
  assert.equal(headlineRetraction.removedInVersion, EXPORT_VERSION);
  assert.match(headlineRetraction.value, /20.{1,3}40%/, 'the record names the figure it withdraws');
  assert.match(headlineRetraction.record, /^https:\/\/stackarchitect\.xyz\/how-we-test\/#/);
  assert.equal(data.canonical, benchmarkMeta.canonical);
  assert.equal(data.license, benchmarkMeta.license);
  assert.equal(data.licenseName, benchmarkMeta.licenseName);
  assert.equal(data.creator, benchmarkMeta.creator);
  assert.equal(data.attribution, `Data: ${benchmarkMeta.name} — ${benchmarkMeta.canonical} (${benchmarkMeta.licenseName})`);

  assert.equal(data.dataPoints.length, dataPoints.length);

  for (let i = 0; i < dataPoints.length; i++) {
    assert.equal(data.dataPoints[i].metric, dataPoints[i].metric);
    assert.equal(data.dataPoints[i].value, dataPoints[i].value);
    assert.equal(data.dataPoints[i].detail, dataPoints[i].detail);
    assert.equal(data.dataPoints[i].source, dataPoints[i].source);
    assert.equal(data.dataPoints[i].sourceUrl, dataPoints[i].sourceUrl);
    assert.equal(data.dataPoints[i].sourceDate, dataPoints[i].sourceDate);
  }
});
