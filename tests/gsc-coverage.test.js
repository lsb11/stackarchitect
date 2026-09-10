// The weekly line's three numbers, tested where they can be: the pure parts.
//
// The GSC calls themselves need a service-account key this repo does not hold,
// so what is verified here is the arithmetic and the shape — the window that
// avoids GSC's reporting lag, the homepage exclusion, and the line format.
// The two API calls are not exercised by these tests.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { weeklyWindow, offHomepageImpressions, weeklyLine } from '../gsc-coverage.mjs';

test('the window is 7 days and ends before GSC has finished counting', () => {
  const { startDate, endDate } = weeklyWindow(new Date('2026-09-10T12:00:00Z'));
  assert.equal(endDate, '2026-09-07', 'ends 3 days back, not today');
  assert.equal(startDate, '2026-09-01', 'seven days inclusive');
  const days = (new Date(endDate) - new Date(startDate)) / 86400000 + 1;
  assert.equal(days, 7);
});

test('a window ending today would report a fall every run — so it does not', () => {
  const today = new Date('2026-09-10T12:00:00Z');
  assert.notEqual(weeklyWindow(today).endDate, '2026-09-10');
});

test('the homepage is excluded from the impression total', () => {
  const rows = [
    { keys: ['https://stackarchitect.xyz/'], impressions: 900 },
    { keys: ['https://stackarchitect.xyz/tools/'], impressions: 7 },
    { keys: ['https://stackarchitect.xyz/stack/'], impressions: 5 },
  ];
  assert.equal(offHomepageImpressions(rows), 12);
});

test('a homepage row carrying query or fragment noise is still the homepage', () => {
  const rows = [
    { keys: ['https://stackarchitect.xyz/?ref=producthunt'], impressions: 400 },
    { keys: ['https://stackarchitect.xyz/#top'], impressions: 100 },
    { keys: ['https://stackarchitect.xyz/apps/'], impressions: 3 },
  ];
  assert.equal(offHomepageImpressions(rows), 3);
});

test('no rows is zero, not a crash', () => {
  assert.equal(offHomepageImpressions([]), 0);
  assert.equal(offHomepageImpressions(undefined), 0);
});

test('a row with no impressions field counts as zero', () => {
  assert.equal(offHomepageImpressions([{ keys: ['https://stackarchitect.xyz/tools/'] }]), 0);
});

test('the line is one tab-separated row and nothing else', () => {
  const line = weeklyLine({
    date: '2026-09-07',
    indexed: 1,
    crawledNotIndexed: 177,
    offhomeImpressions: 12,
  });
  assert.equal(line, '2026-09-07\tindexed=1\tcrawled_not_indexed=177\toffhome_impressions=12');
  assert.equal(line.split('\n').length, 1);
  assert.equal(line.split('\t').length, 4);
});
