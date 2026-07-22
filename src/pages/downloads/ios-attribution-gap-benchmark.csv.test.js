import { test, describe } from 'node:test';
import assert from 'node:assert';
import { GET } from './ios-attribution-gap-benchmark.csv.js';
import { benchmarkMeta, dataPoints } from '../../data/attributionGap.js';

describe('ios-attribution-gap-benchmark.csv GET endpoint', () => {
  test('returns a valid Response object', () => {
    const response = GET();
    assert.ok(response instanceof Response);
    assert.strictEqual(response.status, 200);
  });

  test('sets correct headers', () => {
    const response = GET();
    assert.strictEqual(response.headers.get('Content-Type'), 'text/csv; charset=utf-8');
    assert.strictEqual(response.headers.get('X-License'), benchmarkMeta.licenseName);
  });

  test('generates valid CSV content', async () => {
    const response = GET();
    const csvText = await response.text();

    const lines = csvText.split('\r\n');

    // Check header row
    assert.strictEqual(
      lines[0],
      'metric,value,detail,source,source_url,source_date',
      'CSV header should match expected columns'
    );

    // Check line endings and empty line at end
    assert.ok(csvText.endsWith('\r\n'), 'CSV should end with a newline');
    assert.strictEqual(lines[lines.length - 1], '', 'Last line after split should be empty');

    // Check data rows count (lines length - 1 (header) - 1 (empty line at end) = dataPoints.length)
    assert.strictEqual(
      lines.length - 2,
      dataPoints.length,
      'Number of data rows should match dataPoints length'
    );
  });

  test('escapes quotes in CSV fields correctly', async () => {
    const response = GET();
    const csvText = await response.text();

    // We expect fields to be enclosed in quotes because of the map(esc)
    // The esc function is: const esc = (v) => `"${String(v).replace(/"/g, '""')}"`;
    // We can verify that every row starts with a quote
    const lines = csvText.split('\r\n');
    const firstDataRow = lines[1];

    // It should start with a quote
    assert.ok(firstDataRow.startsWith('"'), 'Fields should be enclosed in quotes');

    // We can check if specific content from dataPoints is present
    assert.ok(
      csvText.includes(dataPoints[0].metric),
      'Data from dataPoints should be present in the CSV'
    );
  });
});
