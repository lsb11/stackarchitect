---
title: "Google Sheets Custom Function Errors: Causes and Fixes"
heading: "Google Sheets Custom Function Errors: Loading, #ERROR! and Timeouts Fixed"
description: "Why Apps Script custom functions show Loading..., #ERROR! or \"too many scripts running\", with Google's 30-second limit and working code to fix each one."
answer: "A Google Sheets custom function has 30 seconds to return a value, not the six minutes a normal Apps Script run gets. Every cell that uses it is a separate call to Google's servers, it can only use services that need no authorisation, and it only recalculates when a cell it references changes."
publishDate: "2026-09-26"
updatedDate: "2026-09-26"
verifiedDate: "2026-09-26"
category: "workflow"
readTime: 12
canonical: "https://stackarchitect.xyz/blog/google-sheets-custom-function-errors/"
faqs:
  - question: "What is the time limit for a Google Sheets custom function?"
    answer: "30 seconds per call. If a call does not return in time, the cell shows #ERROR! with the note \"Exceeded maximum execution time (line 0)\". The six-minute limit that applies to other Apps Script runs does not apply to custom functions."
  - question: "Why does my custom function say Loading... forever?"
    answer: "The most common cause is a volatile argument such as NOW() or RAND(); Google states that this makes a custom function display Loading... indefinitely. Other causes are a large queue of per-cell calls and a slow external request. Remove volatile arguments, then replace per-cell formulas with one range formula."
  - question: "How do I fix \"There are too many scripts running simultaneously for this Google user account\"?"
    answer: "Call the function once for a whole range instead of once per cell. Google says this error most commonly comes from custom functions called repeatedly in one spreadsheet. Write the function to accept a range and return a two-dimensional array, and put a single formula at the top of the column."
  - question: "Can a custom function send email or write to other cells?"
    answer: "No. Custom functions cannot ask for authorisation, so they cannot use Gmail, Drive or other services that need it, and they can only return values to their own cell and the cells their result spills into. Put that code in a function run from a custom menu instead."
  - question: "How do I force a custom function to recalculate?"
    answer: "Pass every cell it depends on as an argument, so changing any of them triggers a recalculation. For data that comes from outside the sheet, add a checkbox in a spare cell, pass it as an extra argument, and tick or untick it to rerun the function."
  - question: "Should I use a custom function or a named function?"
    answer: "Use a named function if the logic can be built from Sheets' built-in functions: it runs instantly and needs no authorisation or quota. Use a custom function only when you need something the formula engine cannot do, such as fetching data from an API."
relatedGuides:
  - title: "Google Apps Script quotas explained"
    href: "/blog/google-apps-script-quotas-explained-how-to-avoid-limits-and-scale-your-automations/"
  - title: "Shopify to Google Sheets automation"
    href: "/shopify-google-sheets-automation/"
  - title: "Autocrat quota fix"
    href: "/autocrat-quota-fix/"
---

Almost every custom function error comes from one of those four rules, and the fix is usually the same: call the function once for a whole range instead of once per cell.

*Limits and error messages below are taken from Google's [custom functions guide](https://developers.google.com/apps-script/guides/sheets/functions) and [Apps Script quotas page](https://developers.google.com/apps-script/guides/services/quotas), checked 26 September 2026.*

## Find your error

| What you see | What it means | Fix |
| --- | --- | --- |
| `#ERROR!` with the note **Exceeded maximum execution time (line 0)** | One call took longer than 30 seconds | [Process the range in one call](#fix-one-call-per-range), cache slow lookups, or [move the work to a menu command](#when-a-custom-function-is-the-wrong-tool) |
| **Loading...** that never finishes | A volatile argument such as `NOW()` or `RAND()`, or a queue of hundreds of per-cell calls | [Remove the volatile argument](#loading-that-never-finishes), then switch to one range call |
| **There are too many scripts running simultaneously for this Google user account.** | Too many copies of the function are running at once | [One call per range](#too-many-scripts-running-simultaneously) |
| **Script invoked too many times per second for this Google user account.** | The function started too many times in a short burst | [One call per range](#too-many-scripts-running-simultaneously) |
| **You do not have permission to call X service.** | The function used a service that needs authorisation | [Run the code from a custom menu](#you-do-not-have-permission-to-call-a-service) |
| An error saying the result would overwrite existing data | The returned array has no empty cells to spill into | [Clear the spill area](#the-result-would-overwrite-data) |
| The value never updates | The function does not reference the cells it depends on | [Pass the range as an argument, or add a refresh cell](#the-value-never-updates) |

## Why custom functions fail differently from other scripts

A custom function is Apps Script code you call from a cell, like `=STOCK(A2)`. It runs under tighter rules than a script you start from the editor, a menu or a trigger. Google's guide sets out four of them.

**1. 30 seconds per call.** A custom function call must return within 30 seconds, or the cell shows `#ERROR!`. Normal script runs get six minutes. The two limits are separate, and fixing one does nothing for the other. The six-minute runtime, daily trigger runtime and URL Fetch caps are covered in [Google Apps Script quotas explained](/blog/google-apps-script-quotas-explained-how-to-avoid-limits-and-scale-your-automations/).

**2. One server call per cell.** Each use of a custom function in a sheet is a separate call to the Apps Script server. Google warns that sheets with many custom function calls can be slow and may see a temporary delay in executions. Fill a formula down 800 rows and you have asked for 800 separate executions.

**3. No authorisation, so a short list of services.** Custom functions never ask the user for permission, so they can only use services that do not touch personal data. Google lists them as Cache, HTML, JDBC, Language, Lock, Maps, Properties, Spreadsheet (read only), URL Fetch, Utilities and XML. A custom function cannot send email, create files, write to other cells, or open another spreadsheet with `openById()` or `openByUrl()`.

**4. Recalculation follows references.** A custom function reruns when a cell passed to it as an argument changes, or when you edit the formula. Reading a range inside the function with `getValue()` does not count as a reference. Arguments must also be deterministic: volatile functions such as `NOW()` and `RAND()` are not allowed as arguments.

## Each error, and how to fix it

### Exceeded maximum execution time (line 0)

The cell shows `#ERROR!`, and hovering over it shows **Exceeded maximum execution time (line 0)**. One call ran past 30 seconds.

The usual causes are a slow external request made with `UrlFetchApp`, a loop over a large range, or both. The fixes, in order of how often they work:

1. **Take the whole range in one call** and return a two-dimensional array. One call that makes one batch of requests is far faster than hundreds of calls that each make one. The [code below](#fix-one-call-per-range) shows how.
2. **Fetch in parallel.** `UrlFetchApp.fetchAll()` sends a list of requests at once, so a batch takes roughly as long as its slowest request rather than the sum of all of them.
3. **Cache slow results** with `CacheService`, so a recalculation reads stored values instead of fetching again. Google's guide describes the Cache service as working but "not particularly useful" in custom functions. That holds when each cell makes its own call. It stops holding once one call handles a whole range of slow lookups, as in the code below.
4. **If it still needs more than 30 seconds, it should not be a custom function.** Run the same work from a custom menu, where the limit is six minutes and every service is available. See [when a custom function is the wrong tool](#when-a-custom-function-is-the-wrong-tool).

### Loading... that never finishes

Every custom function shows **Loading...** briefly while it runs. When it never goes away, check these in order:

- **A volatile argument.** Google states that a custom function returning a value based on a volatile built-in function such as `NOW()` or `RAND()` displays **Loading...** indefinitely. Remove the volatile function from the arguments. If you need the current time, compute it inside the function with `new Date()`.
- **A queue of per-cell calls.** Hundreds of cells calling the same function can take a long time to clear, and some sit on **Loading...** while they wait. Replace them with one range call.
- **A slow external source.** If the function waits on a slow API, it may be close to the 30-second limit on every call. Cache the results, or move the fetch to a menu command.

### Too many scripts running simultaneously

Two related messages:

- **There are too many scripts running simultaneously for this Google user account.**
- **Script invoked too many times per second for this Google user account.**

Google's quotas page says both most commonly occur for custom functions that are called repeatedly in a single spreadsheet. Its published limits also cap simultaneous executions at 30 per user. A column of formulas that all recalculate together, for example after a sort, a paste or reopening the sheet, can start far more executions than that at once.

The fix Google gives is to write the function so it only needs to be called once per range of data. Replace `=STOCK(A2)` filled down the column with a single `=STOCK_BULK(A2:A)` in the top cell. Retrying or adding `Utilities.sleep()` does not help here, because the problem is the number of executions, not the speed of any one of them.

### You do not have permission to call a service

The message reads **You do not have permission to call X service**, with X naming a service such as `MailApp` or `DriveApp`. Custom functions cannot ask for authorisation, so any service outside Google's list above fails this way. The common cases are sending email, creating documents, and writing values to other cells.

Google's recommended fix is to put the code in a function run from a custom menu. A menu function asks for authorisation the first time it runs and can then use every Apps Script service. The [menu version below](#when-a-custom-function-is-the-wrong-tool) shows the pattern.

### The result would overwrite data

A custom function that returns a two-dimensional array fills the cells below and to the right of the formula, as long as they are empty. If any of them already hold a value, Google's guide says the function throws an error instead of overwriting them. Clear the cells in the spill area, or move the formula to where it has room. A range argument such as `A2:A` returns one row for every row in the sheet, blank rows included, so keep the column below the formula empty.

### The value never updates

A custom function only recalculates when a cell passed to it as an argument changes, or when the formula itself is edited. Two patterns cause stale values:

- **The function reads cells directly.** If it uses `getRange().getValue()` instead of taking the range as an argument, Sheets does not know it depends on those cells. Pass the range in as an argument.
- **The data lives outside the sheet.** A function that fetches stock levels or prices from an API has no referenced cell that changes when the source does. Add a refresh cell: put a checkbox in a spare cell such as `Z1`, pass it as an extra argument (`=STOCK_BULK(A2:A, $Z$1)`), and tick or untick it to force a recalculation.

## Fix: one call per range

The pattern that breaks most often in Shopify operations sheets is a lookup per SKU row: one formula per product that fetches its stock level or price from an API. It works with 40 products. It starts failing as the catalogue grows, because every new row adds another execution and another request.

Here is the per-cell version that causes the errors above:

```javascript
// Called as =STOCK(A2) and filled down: one execution and one request per row.
const STOCK_ENDPOINT = 'https://example.com/api/stock?sku='; // replace with your source

/**
 * Stock level for one SKU.
 * @param {string} sku
 * @return {number}
 * @customfunction
 */
function STOCK(sku) {
  const res = UrlFetchApp.fetch(STOCK_ENDPOINT + encodeURIComponent(sku));
  return JSON.parse(res.getContentText()).available;
}
```

And the range version. It runs once for the whole column, reads cached values first, fetches only what is missing in parallel batches, and stops fetching before the 30-second limit:

```javascript
// Called once as =STOCK_BULK(A2:A) or =STOCK_BULK(A2:A, $Z$1)
const STOCK_ENDPOINT = 'https://example.com/api/stock?sku='; // replace with your source
const CACHE_SECONDS  = 21600;      // 6 hours, the longest Google allows
const BUDGET_MS      = 20 * 1000;  // stop starting new batches at 20s of the 30s limit
const BATCH          = 20;         // requests per fetchAll batch

/**
 * Stock levels for a whole column of SKUs in one call.
 * @param {string[][]} skus The SKU range, e.g. A2:A.
 * @param {*} refresh Optional: a cell to change when you want a recalculation.
 * @return {Array<Array<number|string>>} One stock level per row.
 * @customfunction
 */
function STOCK_BULK(skus, refresh) {
  const started = Date.now();
  const rows = Array.isArray(skus) ? skus : [[skus]];
  const list = rows.map(function (r) { return String(r[0]).trim(); });
  const unique = Array.from(new Set(list.filter(function (s) { return s !== ''; })));

  // 1. Everything already cached comes back in one call.
  const cache = CacheService.getScriptCache();
  const known = cache.getAll(unique.map(key_));

  // 2. Fetch only what is missing, in parallel batches, inside the time budget.
  const missing = unique.filter(function (s) { return known[key_(s)] == null; });
  const fresh = {};
  for (let i = 0; i < missing.length; i += BATCH) {
    if (Date.now() - started > BUDGET_MS) break;
    const batch = missing.slice(i, i + BATCH);
    const responses = UrlFetchApp.fetchAll(batch.map(function (s) {
      return { url: STOCK_ENDPOINT + encodeURIComponent(s), muteHttpExceptions: true };
    }));
    responses.forEach(function (res, j) {
      if (res.getResponseCode() !== 200) return;
      try {
        const value = JSON.parse(res.getContentText()).available;
        if (value != null) fresh[key_(batch[j])] = String(value);
      } catch (e) {
        // Leave it uncached; it is retried on the next recalculation.
      }
    });
  }
  if (Object.keys(fresh).length > 0) cache.putAll(fresh, CACHE_SECONDS);

  // 3. One output row per input row, blanks included, so the result lines up.
  return list.map(function (s) {
    if (s === '') return [''];
    const hit = fresh[key_(s)] != null ? fresh[key_(s)] : known[key_(s)];
    if (hit == null) return ['Not fetched yet'];
    const n = Number(hit);
    return [isNaN(n) ? hit : n];
  });
}

function key_(sku) {
  return 'stk:' + sku;
}
```

### Why each part is there

- **One call for the range** removes the "too many scripts" errors, because the column now starts one execution instead of hundreds.
- **`fetchAll` in batches of 20** means each batch costs roughly one request's worth of time rather than twenty.
- **The 20-second budget is checked before each batch, not during one.** A batch that has started must finish, so the budget leaves room for one slow batch before the 30-second limit.
- **Rows it does not reach show "Not fetched yet"** instead of failing the whole column. Tick the refresh cell and the function runs again: cached rows return at once, and the time goes on the rows still missing. A large catalogue fills in over two or three refreshes.
- **Blank rows return a blank**, so the output always has exactly one row per input row and the spill lines up with your SKUs.
- **Cached for six hours**, the longest `CacheService` allows. Stock that changes faster than that needs a shorter value.

### Where this pattern stops working

`CacheService` holds at most 1,000 items. When more are written, Google keeps the 900 furthest from expiry and drops the rest, and it notes that items can be removed early when a lot of data is cached. Each key can be up to 250 characters and each value up to 100KB. With one entry per SKU, this pattern suits catalogues of up to roughly 900 SKUs. Past that, cached values start disappearing between refreshes and the column never fills. At that size, the menu version below is the better tool.

## When a custom function is the wrong tool

A custom function is right for a quick calculation that has to stay live in a cell. It is the wrong tool when the work needs more than 30 seconds, needs a service outside Google's list, or has to write to other cells. For those, run the code from a custom menu and write plain values into the sheet:

```javascript
// Adds a "Stock" menu. Choosing "Refresh stock levels" writes values into column B.
const STOCK_ENDPOINT = 'https://example.com/api/stock?sku='; // replace with your source

function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('Stock')
    .addItem('Refresh stock levels', 'refreshStock')
    .addToUi();
}

function refreshStock() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Products');
  const last = sheet.getLastRow();
  if (last < 2) return;

  const skus = sheet.getRange(2, 1, last - 1, 1).getValues()
    .map(function (r) { return String(r[0]).trim(); });
  const out = skus.map(function () { return ['']; });

  for (let i = 0; i < skus.length; i += 20) {
    const idx = [];
    const requests = [];
    for (let j = i; j < Math.min(i + 20, skus.length); j++) {
      if (skus[j] === '') continue;
      idx.push(j);
      requests.push({ url: STOCK_ENDPOINT + encodeURIComponent(skus[j]), muteHttpExceptions: true });
    }
    if (requests.length === 0) continue;
    UrlFetchApp.fetchAll(requests).forEach(function (res, k) {
      let value = 'Error ' + res.getResponseCode();
      if (res.getResponseCode() === 200) {
        try { value = JSON.parse(res.getContentText()).available; } catch (e) { value = 'Bad response'; }
      }
      out[idx[k]] = [value];
    });
  }

  sheet.getRange(2, 2, out.length, 1).setValues(out);   // one write for the whole column
  sheet.getRange('D1').setValue('Updated ' +
    Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd HH:mm'));
}
```

What changes compared with the custom function:

- **Six minutes instead of 30 seconds**, and every Apps Script service is available after a one-off authorisation.
- **Values are written once and stay put.** Sorting, filtering or reopening the sheet does not trigger hundreds of recalculations, so the "too many scripts" errors cannot happen.
- **You control when it runs.** Choose the menu item, or add a time-driven trigger to run it on a schedule. Triggered runs count toward the daily trigger runtime quota: 90 minutes a day on a consumer account and six hours on Workspace.
- **Past six minutes**, split the job across runs with the resumable batch pattern in [Google Apps Script quotas explained](/blog/google-apps-script-quotas-explained-how-to-avoid-limits-and-scale-your-automations/#resumable).

If the sheet is a Shopify order or inventory log that other people edit, consider whether it should be fed by a script at all. [Shopify to Google Sheets automation](/shopify-google-sheets-automation/) covers sending orders into a sheet from outside Apps Script, which avoids both sets of limits.

## Check whether you need a script at all

Google's own guide suggests checking whether the logic can be built as a [named function](https://support.google.com/docs/answer/12504534) before writing a custom function. A named function is a saved formula built from Sheets' built-in functions. It runs on the spreadsheet engine, needs no authorisation, and counts against no Apps Script quota. If your custom function only does arithmetic, text handling or lookups within the spreadsheet, a named function removes every error on this page.

Custom functions earn their place when they need something the formula engine cannot do, most often fetching data from outside the sheet.

## Keep API keys out of shared sheets

A script bound to a spreadsheet shares that spreadsheet's access list: anyone who can edit the sheet can open the script. If a custom function or menu function calls an API with a key or access token, anyone with edit access can see it. For a Shopify store, that token can read orders and customer data. Keep keys out of sheets that are shared widely, and give any token only the read access the lookup needs.
