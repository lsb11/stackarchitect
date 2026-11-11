---
title: "Google Sheets custom function errors: why =MYFUNC() breaks at scale, and the one-call-per-range fix"
subtitle: "Loading… forever, #ERROR! after 30 seconds, and 'too many scripts running simultaneously', explained from Google's own limits"
tags: google-sheets, google-apps-script, javascript, automation
canonical: https://stackarchitect.xyz/blog/google-sheets-custom-function-errors/
---

A Google Sheets custom function has 30 seconds to return a value, not the six minutes a normal Apps Script run gets. Every cell that uses it is a separate call to Google's servers, it can only use services that need no authorisation, and it only recalculates when a cell it references changes.

Almost every custom function error comes from one of those four rules. The fix is usually the same: call the function once for a whole range, not once per cell.

*Limits and error messages are from Google's custom functions guide and Apps Script quotas page, checked 26 September 2026.*

## Find your error

| What you see | What it means | Fix |
|---|---|---|
| `#ERROR!` with *Exceeded maximum execution time (line 0)* | One call took longer than 30 seconds | One range call, cache slow lookups, or move the work to a menu |
| *Loading…* that never finishes | A volatile argument such as `NOW()` or `RAND()`, or a queue of per-cell calls | Remove the volatile argument, then one range call |
| *There are too many scripts running simultaneously for this Google user account.* | Too many copies running at once | One range call |
| *Script invoked too many times per second for this Google user account.* | Too many starts in a short burst | One range call |
| *You do not have permission to call X service.* | The function used a service that needs authorisation | Run the code from a custom menu |
| The value never updates | The function doesn't reference the cells it depends on | Pass the range as an argument, or add a refresh cell |

## Why custom functions fail differently

**30 seconds per call.** Normal script runs get six minutes. The two limits are separate, and fixing one does nothing for the other.

**One server call per cell.** Fill a formula down 800 rows and you've asked for 800 separate executions. Google's quotas page also caps simultaneous executions at 30 per user, and a column of formulas recalculating together after a sort, a paste or reopening the sheet can start far more than that at once. That's where the "too many scripts" errors come from, and why `Utilities.sleep()` or retrying doesn't help: the problem is the number of executions, not the speed of any one.

**No authorisation.** Custom functions can only use Cache, HTML, JDBC, Language, Lock, Maps, Properties, Spreadsheet (read only), URL Fetch, Utilities and XML. They can't send email, create files, write to other cells, or open another spreadsheet.

**Recalculation follows references.** Reading a range inside the function with `getValue()` doesn't count as a reference, and volatile functions such as `NOW()` aren't allowed as arguments: Google says they make the cell show *Loading…* indefinitely.

## The pattern that breaks: one lookup per row

This is the version that works with 40 products and fails as the catalogue grows:

```js
// Called as =STOCK(A2) and filled down: one execution and one request per row.
function STOCK(sku) {
  const res = UrlFetchApp.fetch(STOCK_ENDPOINT + encodeURIComponent(sku));
  return JSON.parse(res.getContentText()).available;
}
```

## The fix: one call for the whole range

It runs once for the column, reads cached values first, fetches only what's missing in parallel batches, and stops starting new batches before the 30-second limit:

```js
// Called once as =STOCK_BULK(A2:A) or =STOCK_BULK(A2:A, $Z$1)
const STOCK_ENDPOINT = 'https://example.com/api/stock?sku='; // replace with your source
const CACHE_SECONDS  = 21600;      // 6 hours, the longest Google allows
const BUDGET_MS      = 20 * 1000;  // stop starting new batches at 20s of the 30s limit
const BATCH          = 20;         // requests per fetchAll batch

/**
 * Stock levels for a whole column of SKUs in one call.
 * @param {string[][]} skus The SKU range, e.g. A2:A.
 * @param {*} refresh Optional: a cell to change when you want a recalculation.
 * @customfunction
 */
function STOCK_BULK(skus, refresh) {
  const started = Date.now();
  const rows = Array.isArray(skus) ? skus : [[skus]];
  const list = rows.map(r => String(r[0]).trim());
  const unique = Array.from(new Set(list.filter(s => s !== '')));

  const cache = CacheService.getScriptCache();
  const known = cache.getAll(unique.map(key_));

  const missing = unique.filter(s => known[key_(s)] == null);
  const fresh = {};
  for (let i = 0; i < missing.length; i += BATCH) {
    if (Date.now() - started > BUDGET_MS) break;
    const batch = missing.slice(i, i + BATCH);
    const responses = UrlFetchApp.fetchAll(batch.map(s => ({
      url: STOCK_ENDPOINT + encodeURIComponent(s), muteHttpExceptions: true
    })));
    responses.forEach((res, j) => {
      if (res.getResponseCode() !== 200) return;
      try {
        const value = JSON.parse(res.getContentText()).available;
        if (value != null) fresh[key_(batch[j])] = String(value);
      } catch (e) { /* retried on the next recalculation */ }
    });
  }
  if (Object.keys(fresh).length > 0) cache.putAll(fresh, CACHE_SECONDS);

  return list.map(s => {
    if (s === '') return [''];
    const hit = fresh[key_(s)] != null ? fresh[key_(s)] : known[key_(s)];
    if (hit == null) return ['Not fetched yet'];
    const n = Number(hit);
    return [isNaN(n) ? hit : n];
  });
}

function key_(sku) { return 'stk:' + sku; }
```

Why each part is there:

- **One call for the range** removes the "too many scripts" errors: the column starts one execution, not hundreds.
- **`fetchAll` in batches of 20** means a batch costs roughly one request's worth of time, not twenty.
- **The 20-second budget is checked before each batch.** A batch that has started must finish, so the budget leaves room for one slow batch.
- **Rows it doesn't reach show "Not fetched yet"** instead of failing the whole column. Tick the refresh cell (`$Z$1`) and cached rows return at once while the time goes on the rest.
- **Blank rows return a blank**, so the output always lines up with your SKUs.

## Where this stops working

`CacheService` holds at most 1,000 items; when more are written, Google keeps the 900 furthest from expiry. With one entry per SKU, this pattern suits catalogues up to roughly 900 SKUs. Past that, run the same work from a custom menu: six minutes instead of 30 seconds, every Apps Script service available after a one-off authorisation, and values written once so a sort can't trigger hundreds of recalculations. The full menu version is in the original guide.

## Check whether you need a script at all

If the logic only uses Sheets' built-in functions, a **named function** runs on the spreadsheet engine, needs no authorisation and counts against no Apps Script quota. That removes every error above. Custom functions earn their place when they need something the formula engine can't do, most often fetching data from outside the sheet.

The full guide, with the menu version, the refresh-cell pattern and a note on keeping API keys out of shared sheets: [Google Sheets custom function errors: Loading, #ERROR! and timeouts fixed](https://stackarchitect.xyz/blog/google-sheets-custom-function-errors/). For the six-minute, trigger-runtime and URL Fetch limits on normal scripts, see [Google Apps Script quotas explained](https://stackarchitect.xyz/blog/google-apps-script-quotas-explained-how-to-avoid-limits-and-scale-your-automations/).

*Originally published at [stackarchitect.xyz](https://stackarchitect.xyz/blog/google-sheets-custom-function-errors/) by Luke Sandelands.*
