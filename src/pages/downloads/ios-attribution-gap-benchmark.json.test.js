import { test } from 'node:test';
import assert from 'node:assert/strict';
import { GET } from './ios-attribution-gap-benchmark.json.js';
import { dataPoints, benchmarkMeta } from '../../data/attributionGap.js';

test('JSON export endpoint returns valid JSON with correct structure', async () => {
  const response = GET();
  assert.equal(response.status, 200);
  assert.equal(response.headers.get('Content-Type'), 'application/json; charset=utf-8');

  const text = await response.text();
  const data = JSON.parse(text);

  assert.equal(data.name, benchmarkMeta.name);
  assert.equal(data.headline, benchmarkMeta.headline);
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
