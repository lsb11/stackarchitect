---
title: "I ran a broken Meta Conversions API event through a validator. It caught seven mistakes Meta might never mention."
published: false
tags: shopify, javascript, api, webdev
canonical_url: https://stackarchitect.xyz/meta-capi-payload-validator/
description: "Some Conversions API mistakes return an error. Others are accepted and never matched, so the purchase quietly disappears. Here is a real broken event, the real validator output, and the fixed version."
---

Meta doesn't always tell you when a Conversions API event is wrong. A missing required field returns an error. An email sent in plain text, or an IP address you hashed by mistake, can be accepted and simply never matched to a customer. The purchase goes missing from your reports and nothing warns you.

So I wrote a typical server-side Purchase event with the mistakes I see most often, and ran it through the open-source [`shopify-capi-validator`](https://www.npmjs.com/package/shopify-capi-validator) package (v1.1.0). Everything below is the real output.

## The broken event

```json
{
  "data": [{
    "event_name": "Purchase",
    "event_time": 1762855200000,
    "action_source": "website",
    "user_data": {
      "em": "Jane.Doe@Example.com ",
      "ph": "+44 (0)7700 900123",
      "client_ip_address": "9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08"
    },
    "custom_data": { "value": 49.99 }
  }]
}
```

It looks plausible. It is wrong in seven ways.

## What the validator reported

```text
$ npx shopify-capi-validator --payload ./bad.json

  Platform: META   Events: 1
  ✓ event_name present (Purchase)
  ✗ event_time looks like milliseconds
      → Meta expects SECONDS (10 digits), not milliseconds (13). Divide by 1000.
  ✓ action_source present (website)
  ! event_id missing
      → Meta marks it optional but recommends it for deduplicating browser Pixel and server events.
  ✗ event_source_url missing
      → Required by Meta for website events: the URL of the page where the event happened.
  ✓ user_data has at least one customer information parameter
  ✗ user_data.client_user_agent missing
      → Required by Meta for website events. Send the browser user agent, unhashed.
  ✗ user_data.em is RAW email (contains "@")
      → PII must be SHA-256 hashed. Lowercase + trim, THEN hash.
  ✗ user_data.ph is not SHA-256 hashed
  ✗ user_data.client_ip_address appears to be hashed
      → client_ip_address must be sent RAW. Hashing it breaks matching.
  ✓ custom_data.value present (49.99)
  ✗ custom_data.currency missing for Purchase

  Summary  4 passed  1 warnings  7 failed
```

It exits with code 1, so the same check can stop a bad deploy in CI.

## The seven mistakes, and why each one matters

**1. Milliseconds instead of seconds.** Meta's `event_time` is a Unix timestamp in seconds. `Date.now()` in JavaScript returns milliseconds, which is the most common cause. Use `Math.floor(Date.now() / 1000)`.

**2. No `event_source_url` on a website event.** Meta requires it when `action_source` is `website`. Server-side setups often drop it because the server never sees the browser.

**3. No `client_user_agent` on a website event.** Also required for website events, and also lost when the event is built on a server. Capture both values in the browser and pass them to the server with the order.

**4. A raw email.** Email, phone, name, city, state, postcode and country must be SHA-256 hashed. A plain-text email isn't matched, and Meta doesn't always say so.

**5. An unhashed phone number,** with a trap inside it. `+44 (0)7700 900123` becomes `4407700900123` if you only strip symbols. The zero after the country code is a national prefix, not part of the international number, so the correct value before hashing is `447700900123`.

**6. A hashed IP address.** The opposite mistake. `client_ip_address`, `client_user_agent`, `fbc` and `fbp` must be sent as they are. A hashed IP can't be matched.

**7. No currency on a Purchase.** Meta requires both `value` and `currency` on purchase events.

The warning matters too: `event_id` is optional, but Meta merges a browser Pixel event and a server event into one purchase only when the event name and `event_id` match. Without it, a store running both can count each purchase twice.

## The fixed event

```json
{
  "data": [{
    "event_name": "Purchase",
    "event_time": 1762851600,
    "event_id": "order_1001",
    "action_source": "website",
    "event_source_url": "https://example-store.myshopify.com/checkouts/thank_you",
    "user_data": {
      "em": ["<sha256 of jane.doe@example.com>"],
      "ph": ["<sha256 of 447700900123>"],
      "client_ip_address": "203.0.113.7",
      "client_user_agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X)"
    },
    "custom_data": { "value": 49.99, "currency": "GBP" }
  }]
}
```

```text
  Summary  12 passed  0 warnings  0 failed
```

## Format first, then hash

The validator can tell whether a field is hashed. It can't tell whether you formatted the value correctly before hashing, because a hash of a badly formatted value still looks like a valid hash. Meta's formatting rules:

| Field | Format before hashing |
|---|---|
| `em` | Trim spaces, lowercase |
| `ph` | Digits only, with country code, no national-prefix zero |
| `fn`, `ln` | Lowercase, no punctuation |
| `ct` | Lowercase, no punctuation or spaces |
| `st` | Lowercase; US states as the 2-letter code |
| `zp` | Lowercase, no spaces or dashes; first 5 digits for US zips |
| `country` | Lowercase ISO 3166-1 alpha-2, such as `gb` |

One more rule worth knowing before you build a retry queue: if any event in a request is more than 7 days old, Meta rejects the whole request and processes none of it.

## Try it without installing anything

There's a browser version of the same checks, with a hash helper that applies the formatting rules above. It makes no network requests, so nothing you paste leaves your browser: [Meta Conversions API payload validator](https://stackarchitect.xyz/meta-capi-payload-validator/). Each rule links to the Meta documentation it comes from, checked on 28 September 2026.

*Originally published at [stackarchitect.xyz](https://stackarchitect.xyz/meta-capi-payload-validator/) by Luke Sandelands, author of shopify-capi-validator.*
