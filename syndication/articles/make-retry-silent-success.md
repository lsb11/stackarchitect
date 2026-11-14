---
title: "I added Retry to every Make.com scenario I publish. Two of them still couldn't retry anything."
canonical_url: https://stackarchitect.xyz/blog/the-complete-guide-to-reliable-shopify-automations/
tags: automation, nocode, shopify, webdev
description: "A Make.com error handler only fires if the step reports an error. One HTTP setting decides that, and in two of my public scenarios it was off. The five-setting audit and the two-minute test that catch it."
---

On 11 November I went through the free Make.com scenarios I publish for Shopify stores and replaced every **Ignore** error handler with **Retry**, and switched on **Store incomplete executions**. Failed calls would now be retried three times, fifteen minutes apart, then kept for re-running instead of being thrown away. Job done.

The next day I opened two of them again and found the fix did nothing for the failures that mattered most.

## The setting that decides whether an error exists

Make's HTTP module has an advanced setting called **Return error if HTTP request fails**. Make's own description of it is short: "The module will treat 4xx and 5xx responses as errors."

Read that the other way round. With the setting on **No**, a 400 or a 500 is not an error. The module receives the reply, the run carries on, and the scenario history shows a success. An error handler, any error handler, only runs when a module raises an error. So with this setting off, my new Retry handler had nothing to catch.

That's exactly how an earlier failure stayed hidden. The Meta request in my CAPI Shield blueprint was written against a Graph API version that Meta retired in May 2026. From that day every request came back 400, and every run finished green, for about four months. Three settings hid it together: the HTTP module didn't treat error replies as errors, the step's handler was set to Ignore, and failed runs weren't stored. I had fixed two of the three. On two scenarios, the Meta one and the TikTok one, the first was still off.

Both are now set to **Yes**. I found it by opening the module and reading the setting, not because anything told me.

## Why this one is easy to miss

You won't see it unless you go looking. It sits under **Show advanced settings** at the bottom of the HTTP module, a long scroll below the URL, headers and body you actually came to edit.

The error handler, by contrast, is right there on the canvas: an orange Retry circle hanging off the module. It looks finished. Nothing on the canvas tells you the module it's attached to will never raise an error for it to handle.

## The five settings to check on every scenario that calls an outside API

I now check these on every scenario before I publish or switch it on:

1. **Every step that sends data out has an error handler, and it's Retry, not Skip.** Make renamed its handlers: **Skip** is what older guides call Ignore, and **Retry** is what they call Break. Skip discards the failed bundle and the run finishes as a success.
2. **Every HTTP module has Return error if HTTP request fails set to Yes.** Without it, a 4xx or 5xx never reaches the handler.
3. **Scenario settings → Store incomplete executions is Yes.** This is where Retry keeps a run that still fails after its attempts, so you can fix the cause and re-run it.
4. **A webhook scenario runs Immediately as data arrives.** One of mine was set to run every 15 minutes, which delayed every order by up to a quarter of an hour.
5. **No module carries a Deprecated label.** Make labels outdated modules on the canvas. When I opened my Google Ads scenario, its Upload a Click Conversion module said: "This module is deprecated and may not work. We recommend replacing it with an alternative."

## The gap even all five don't close

Some APIs report a rejected event with HTTP 200 and the error inside the reply. TikTok's Events API can answer with a non-zero `code` in the body. To Make that's a 200, so it's a success, so it's never retried.

For those, check the reply, not the status. On a test run, click the HTTP step in the scenario's history and read the reply: for TikTok, `"code": 0` means the event was accepted. If you want it enforced on every order, add a filter after the request that stops the run when `code` isn't 0, so the failure shows up instead of passing.

## The two-minute test that would have caught all of it

Configuration you've read isn't configuration you've tested. So test a failure on purpose:

1. Clone the scenario, so the real one keeps running.
2. In the clone, change the access token to something wrong.
3. Click **Run once** and send it a sample order.
4. Open the run in **History**.

If that run is a success, your error handling isn't seeing errors, whatever the canvas looks like. With Retry working, Make marks the step as a warning and keeps the bundle for retry. Mine would have shown success on both scenarios until the day I changed the setting.

## Broken processes are loud. Automated ones aren't.

There's a broader version of this that I gave in a research piece this week, about a Shopify profit report I automated before fixing the cost data underneath it. The automated report was "clean, confident" and wrong, and nobody noticed, because nothing about it looked wrong. My point there was that broken manual processes are loud: somebody complains, and that's how they get fixed. "Automate one without fixing it and the complaints stop while the errors continue."

An error handler that can never fire is the same thing in miniature. The scenario goes quiet, the history fills with green, and the one signal you had, a failed run, has been switched off without anyone deciding to.

So the job isn't adding the handler. It's proving the failure still reaches you.

## The short version

- An error handler only runs if the module raises an error.
- In Make's HTTP module, **Return error if HTTP request fails** decides that. Set it to **Yes**.
- Use **Retry**, not Skip, and set **Store incomplete executions** to **Yes**.
- APIs that report errors inside a 200 need a filter on the reply.
- Test a failure on purpose before you trust a green history.

The full guide, with screenshots from my own Make account and the patterns for deduplicating orders and a daily count check that catches every kind of failure: [Reliable Shopify automations: make every failure visible](https://stackarchitect.xyz/blog/the-complete-guide-to-reliable-shopify-automations/).

*Originally published at [stackarchitect.xyz](https://stackarchitect.xyz/blog/the-complete-guide-to-reliable-shopify-automations/) by Luke Sandelands.*
