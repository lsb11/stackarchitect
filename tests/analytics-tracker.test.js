/**
 * The GA4 click tracker in src/layouts/Base.astro, run for real.
 *
 * WHY THIS EXISTS
 * The tracker is the only thing that tells GA4 which page earned money, and
 * it is an inline string in an .astro file, so nothing type-checks it and no
 * build guard reads it. It has already shipped two silent faults of exactly
 * this shape — three pages firing their own duplicate affiliate_click, and a
 * handler that overwrote the Stripe client_reference_id — and both were found
 * by reading, not by a failure. A wrong parameter here does not break a page;
 * it produces a dashboard that is confidently wrong.
 *
 * So: extract the inline script out of Base.astro, run it in a vm against a
 * small DOM stub, dispatch synthetic clicks, and assert on what reached
 * dataLayer. No build and no browser needed.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const SRC = fs.readFileSync(new URL('../src/layouts/Base.astro', import.meta.url), 'utf8');

/** The tracker block, between the two placeholder comments. */
function trackerSource() {
  const start = SRC.indexOf('<!-- GA4_PLACEHOLDER_START -->');
  const end = SRC.indexOf('<!-- GA4_PLACEHOLDER_END -->');
  assert.ok(start > -1 && end > start, 'GA4 placeholder comments not found in Base.astro');
  const block = SRC.slice(start, end);
  // The last inline <script> in the block is the tracker; the first is the
  // set:html bootstrap, which is an Astro expression and not runnable here.
  const scripts = [...block.matchAll(/<script is:inline>([\s\S]*?)<\/script>/g)];
  assert.equal(scripts.length, 1, 'expected exactly one runnable inline script in the GA4 block');
  return scripts[0][1];
}

/** Minimal anchor stub. */
function anchor(href, attrs = {}, text = 'Click me') {
  const origin = 'https://stackarchitect.xyz';
  return {
    _attrs: attrs,
    href: href.startsWith('http') ? href : new URL(href, origin).toString(),
    innerText: text,
    getAttribute: (n) => (n === 'href' ? href : (attrs[n] ?? null)),
    setAttribute() {},
    getBoundingClientRect: () => ({ top: 100 }),
  };
}

/**
 * Boots the tracker on a stub page and returns helpers.
 * `bootstrap` is whatever window.__saAnalytics should hold.
 */
async function boot({
  path = '/tools/', search = '', referrer = '', local: seedLocal = {}, consent = 'granted', cookie = '',
} = {}) {
  const { analyticsBootstrap } = await import('../src/data/analytics.ts');
  const listeners = { document: {}, window: {} };
  const store = new Map();
  // Most tests are about what the tracker sends, so they start from a
  // visitor who has already accepted. The consent tests pass consent: null.
  const local = new Map(Object.entries(consent ? { sa_consent: consent, ...seedLocal } : seedLocal));
  const injected = [];
  const cookies = new Map(cookie ? cookie.split('; ').map((c) => c.split('=')) : []);
  const bannerStub = {
    hidden: true,
    contains: () => false,
    querySelector: () => ({ focus() {} }),
  };
  let reloads = 0;

  const documentStub = {
    readyState: 'complete',
    title: 'Test page',
    referrer,
    // A cookie jar that behaves like document.cookie: reads join, writes set
    // one cookie, and an expiry in the past deletes it.
    get cookie() { return [...cookies].map(([k, v]) => `${k}=${v}`).join('; '); },
    set cookie(str) {
      const [pair] = str.split(';');
      const i = pair.indexOf('=');
      const k = pair.slice(0, i).trim();
      if (/expires=Thu, 01 Jan 1970/.test(str)) cookies.delete(k);
      else cookies.set(k, pair.slice(i + 1));
    },
    documentElement: { scrollHeight: 2000 },
    addEventListener(type, fn) { (listeners.document[type] ||= []).push(fn); },
    querySelector: () => null,
    getElementById: (id) => (id === 'sa-consent' ? bannerStub : null),
    createElement: (tag) => ({ tag }),
    head: { appendChild: (el) => injected.push(el) },
    activeElement: null,
  };

  const windowStub = {
    location: {
      href: 'https://stackarchitect.xyz' + path + search,
      pathname: path,
      search,
      hostname: 'stackarchitect.xyz',
      reload: () => { reloads++; },
    },
    addEventListener(type, fn) { (listeners.window[type] ||= []).push(fn); },
    requestAnimationFrame: () => {},
    scrollY: 0,
    innerHeight: 800,
  };

  const sandbox = {
    window: windowStub,
    document: documentStub,
    URL,
    Date,
    Math,
    JSON,
    btoa: (s) => Buffer.from(s, 'binary').toString('base64'),
    sessionStorage: {
      getItem: (k) => (store.has(k) ? store.get(k) : null),
      setItem: (k, v) => store.set(k, String(v)),
      removeItem: (k) => store.delete(k),
    },
    localStorage: {
      getItem: (k) => (local.has(k) ? local.get(k) : null),
      setItem: (k, v) => local.set(k, String(v)),
      removeItem: (k) => local.delete(k),
    },
  };
  sandbox.globalThis = sandbox;
  vm.createContext(sandbox);

  // The bootstrap payload, evaluated exactly as the page emits it.
  vm.runInContext(analyticsBootstrap(), sandbox);
  vm.runInContext(trackerSource(), sandbox);

  const events = () =>
    (windowStub.dataLayer || [])
      .map((a) => Array.from(a))
      .filter((a) => a[0] === 'event')
      .map((a) => ({ name: a[1], params: a[2] }));

  const globals = () =>
    Object.assign({}, ...(windowStub.dataLayer || [])
      .map((a) => Array.from(a))
      .filter((a) => a[0] === 'set')
      .map((a) => a[1]));

  const click = (a) => {
    for (const fn of listeners.document.click || []) {
      fn({ target: { closest: (sel) => (sel === 'a' ? a : null) } });
    }
  };

  /** Press a banner button: 'granted' (Accept) or 'denied' (Reject). */
  const answer = (choice) => {
    const button = { hasAttribute: () => false, getAttribute: (n) => (n === 'data-consent' ? choice : null) };
    for (const fn of listeners.document.click || []) {
      fn({ target: { closest: (sel) => (sel.includes('data-consent') ? button : null) } });
    }
  };

  const consentCalls = () =>
    (windowStub.dataLayer || [])
      .map((a) => Array.from(a))
      .filter((a) => a[0] === 'consent')
      .map((a) => ({ mode: a[1], ...a[2] }));

  /** gtag.js requests: the only way this page can reach Google. */
  const gtagLoads = () => injected.filter((el) => /googletagmanager\.com\/gtag\/js/.test(el.src || ''));

  return {
    click, answer, events, globals, local, store, consentCalls, gtagLoads,
    banner: bannerStub,
    cookie: () => documentStub.cookie,
    reloads: () => reloads,
    dataLayer: () => (windowStub.dataLayer || []).map((a) => Array.from(a)),
    last: () => events().at(-1),
  };
}

test('affiliate click sends the partner slug and the placement tag separately', async () => {
  const page = await boot({ path: '/tools/' });
  page.click(anchor('/go/make/?source=tools-hero'));

  const e = page.last();
  assert.equal(e.name, 'affiliate_click');
  assert.equal(e.params.partner, 'make', 'partner must be the slug alone, not the slug plus query string');
  assert.equal(e.params.source_tag, 'tools-hero');
  assert.equal(e.params.destination, '/go/make/?source=tools-hero');
  assert.equal(e.params.source_page, '/tools/');
});

test('a /go/ link with no source tag still reports its partner', async () => {
  const page = await boot();
  page.click(anchor('/go/getresponse/'));
  const e = page.last();
  assert.equal(e.params.partner, 'getresponse');
  assert.equal(e.params.source_tag, '');
});

test('Stripe click is a begin_checkout carrying the price from products.ts', async () => {
  const { KIT_PRICE, KIT_STRIPE_URL } = await import('../src/data/products.ts');
  const page = await boot({ path: '/pro/' });
  page.click(anchor(KIT_STRIPE_URL + '?client_reference_id=pro_hero', { 'data-cta': 'pro_hero' }));

  const e = page.last();
  assert.equal(e.name, 'begin_checkout');
  assert.equal(e.params.value, KIT_PRICE);
  assert.equal(e.params.currency, 'USD');
  assert.equal(e.params.product, 'complete-kit');
  assert.equal(e.params.cta_source, 'pro_hero');
  // JSON round-trip: the objects come out of a vm realm, so their
  // prototypes are not reference-equal to this realm's.
  assert.deepEqual(JSON.parse(JSON.stringify(e.params.items)), [
    { item_id: 'complete-kit', item_name: 'Complete Kit', price: KIT_PRICE, quantity: 1 },
  ]);
});

test('every single blueprint Payment Link resolves to its own product', async () => {
  const { PRODUCTS, SINGLE_PRICE } = await import('../src/data/products.ts');
  for (const p of PRODUCTS.filter((x) => x.stripeUrl)) {
    const page = await boot({ path: `/pro/${p.slug}/` });
    page.click(anchor(p.stripeUrl + '?client_reference_id=x'));
    const e = page.last();
    assert.equal(e.name, 'begin_checkout', `${p.slug} did not fire begin_checkout`);
    assert.equal(e.params.product, p.slug);
    assert.equal(e.params.value, SINGLE_PRICE);
  }
});

test('a chooser card to /pro/<slug>/ fires kit_click, not nothing', async () => {
  const page = await boot({ path: '/pro/' });
  page.click(anchor('/pro/capi-shield/', { 'data-cta': 'pro_chooser_capi-shield' }));

  const e = page.last();
  assert.equal(e.name, 'kit_click');
  assert.equal(e.params.product, 'capi-shield');
  assert.equal(e.params.cta_source, 'pro_chooser_capi-shield');
  assert.equal(e.params.value, undefined, 'a funnel step must not carry revenue');
});

test('an unmapped Payment Link sends no value rather than a wrong one', async () => {
  const page = await boot({ path: '/pro/' });
  page.click(anchor('https://buy.stripe.com/unknown_link_not_in_products'));
  const e = page.last();
  assert.equal(e.name, 'begin_checkout');
  assert.equal(e.params.value, undefined);
  assert.equal(e.params.items, undefined);
});

test('an ordinary internal link fires no click event', async () => {
  const page = await boot({ path: '/tools/' });
  const before = page.events().length;
  page.click(anchor('/blog/'));
  assert.equal(page.events().length, before);
});

test('an AI assistant referral is labelled and its source canonicalised', async () => {
  const page = await boot({ path: '/tools/', referrer: 'https://www.perplexity.ai/search?q=x' });
  const g = page.globals();
  assert.equal(g.ai_source, 'perplexity');
  assert.equal(g.campaign_source, 'perplexity');
  assert.equal(g.campaign_medium, 'referral', 'inventing a medium would drop this into Unassigned');
});

test('ChatGPT hosts collapse to one source so the channel group is one line', async () => {
  for (const ref of ['https://chatgpt.com/', 'https://chat.openai.com/']) {
    const page = await boot({ referrer: ref });
    assert.equal(page.globals().ai_source, 'chatgpt', ref);
  }
});

test('a lookalike hostname is not an AI referral', async () => {
  const page = await boot({ referrer: 'https://notopenai.com/' });
  assert.equal(page.globals().ai_source, '');
  assert.equal(page.globals().campaign_source, undefined);
});

test('a real utm_source is never overwritten by the AI canonicaliser', async () => {
  const page = await boot({
    path: '/tools/',
    search: '?utm_source=newsletter&utm_campaign=sep',
    referrer: 'https://www.perplexity.ai/',
  });
  const g = page.globals();
  assert.equal(g.ai_source, 'perplexity', 'still labelled, so the visit is not lost');
  assert.equal(g.campaign_source, undefined, 'but the campaign keeps the source it declared');
});

test('a non-AI referral leaves attribution alone', async () => {
  const page = await boot({ referrer: 'https://news.ycombinator.com/' });
  const g = page.globals();
  assert.equal(g.ai_source, '');
  assert.equal(g.campaign_source, undefined);
  assert.equal(g.campaign_medium, undefined);
});

test('?sa_internal=1 marks the browser internal and it stays marked', async () => {
  const opt = await boot({ path: '/', search: '?sa_internal=1' });
  assert.equal(opt.globals().traffic_type, 'internal');
  assert.equal(opt.local.get('sa_internal'), '1');

  // A later visit with no parameter is still internal.
  const later = await boot({ path: '/tools/', local: { sa_internal: '1' } });
  assert.equal(later.globals().traffic_type, 'internal');
});

test('?sa_internal=0 clears the mark', async () => {
  const page = await boot({ path: '/', search: '?sa_internal=0', local: { sa_internal: '1' } });
  assert.equal(page.globals().traffic_type, undefined);
  assert.equal(page.local.has('sa_internal'), false);
});

test('an ordinary visitor is never tagged internal', async () => {
  const page = await boot({ path: '/tools/' });
  assert.equal(page.globals().traffic_type, undefined);
});

test('internal traffic is tagged, not dropped — the GA4 filter does the excluding', async () => {
  const page = await boot({ path: '/tools/', local: { sa_internal: '1' } });
  page.click(anchor('/go/make/?source=tools-hero'));
  assert.equal(page.last().name, 'affiliate_click');
  assert.ok(page.events().some((e) => e.name === 'page_view'));
});

// ---------- consent (UK PECR / UK GDPR) ----------
// Before Accept the page must make no request to Google and store nothing
// for analytics. In this harness the only route to Google is the gtag.js
// <script> the consent block injects, so "no gtag.js load" is "no network hit".
// scripts/consent-check.mjs checks the same thing on the built site in a real
// browser.

test('all four consent signals default to denied, before the config call', async () => {
  const page = await boot({ consent: null });
  const dl = page.dataLayer();
  const def = dl.findIndex((a) => a[0] === 'consent' && a[1] === 'default');
  const cfg = dl.findIndex((a) => a[0] === 'config');
  assert.ok(def > -1 && def < cfg, 'consent default must precede config');
  assert.deepEqual(JSON.parse(JSON.stringify(dl[def][2])), {
    analytics_storage: 'denied',
    ad_storage: 'denied',
    ad_user_data: 'denied',
    ad_personalization: 'denied',
  });
});

test('before consent: no gtag.js request, no events, no cookies, nothing stored', async () => {
  const page = await boot({ consent: null, path: '/tools/', search: '?utm_source=x' });
  page.click(anchor('/go/make/?source=tools-hero'));
  page.click(anchor('https://buy.stripe.com/unknown_link_not_in_products'));
  assert.equal(page.gtagLoads().length, 0, 'gtag.js must not be requested');
  assert.equal(page.events().length, 0, 'no event may be queued for Google');
  assert.doesNotMatch(page.cookie(), /_ga|sa_attr/, 'no analytics cookie');
  assert.equal(page.store.has('sa_landing'), false, 'no landing record in sessionStorage');
  assert.equal(page.banner.hidden, false, 'the banner is shown');
});

test('a Stripe link keeps its build-time CTA source but gets no journey payload without consent', async () => {
  const { KIT_STRIPE_URL } = await import('../src/data/products.ts');
  const page = await boot({ consent: null, path: '/pro/' });
  const a = anchor(KIT_STRIPE_URL + '?client_reference_id=pro_hero', { 'data-cta': 'pro_hero' });
  const before = a.href;
  page.click(a);
  assert.equal(a.href, before);
});

test('Accept grants analytics_storage only, loads gtag.js once and counts this page', async () => {
  const page = await boot({ consent: null, path: '/tools/' });
  page.answer('granted');

  const update = page.consentCalls().at(-1);
  assert.equal(update.mode, 'update');
  assert.equal(update.analytics_storage, 'granted');
  assert.equal(update.ad_storage, undefined, 'ad signals are never granted');
  assert.equal(update.ad_user_data, undefined);
  assert.equal(update.ad_personalization, undefined);

  assert.equal(page.gtagLoads().length, 1);
  assert.deepEqual([...page.events().map((e) => e.name)], ['page_view']);
  assert.equal(page.local.get('sa_consent'), 'granted');
  assert.ok(page.store.has('sa_landing'), 'landing record stored once consent exists');
  assert.equal(page.banner.hidden, true);

  page.click(anchor('/go/make/?source=tools-hero'));
  assert.equal(page.last().name, 'affiliate_click', 'hits flow after Accept');
  assert.match(page.cookie(), /sa_attr=/);

  page.answer('granted');
  assert.equal(page.gtagLoads().length, 1, 'gtag.js is loaded once, not per answer');
});

test('a returning visitor who accepted is tracked with no banner', async () => {
  const page = await boot({ consent: 'granted' });
  assert.equal(page.gtagLoads().length, 1);
  assert.equal(page.banner.hidden, true);
  assert.ok(page.events().some((e) => e.name === 'page_view'));
});

test('Reject: nothing sent, no gtag.js, and the choice sticks', async () => {
  const page = await boot({ consent: null });
  page.answer('denied');
  page.click(anchor('/go/make/?source=tools-hero'));
  assert.equal(page.gtagLoads().length, 0);
  assert.equal(page.events().length, 0);
  assert.equal(page.local.get('sa_consent'), 'denied');
  assert.equal(page.banner.hidden, true);
  assert.equal(page.reloads(), 0, 'nothing was loaded, so nothing to unload');

  const later = await boot({ consent: 'denied' });
  later.click(anchor('/go/make/?source=tools-hero'));
  assert.equal(later.gtagLoads().length, 0);
  assert.equal(later.events().length, 0);
  assert.equal(later.banner.hidden, true, 'the banner does not come back');
});

test('Reject after an earlier Accept deletes the analytics cookies and reloads', async () => {
  const page = await boot({ consent: 'granted', cookie: '_ga=GA1.1.1; _ga_TE6Z6CW514=GS1.1; sa_attr=x; other=keep' });
  page.answer('denied');
  assert.doesNotMatch(page.cookie(), /_ga|sa_attr/);
  assert.match(page.cookie(), /other=keep/, 'only analytics cookies are touched');
  assert.equal(page.reloads(), 1, 'a running gtag.js is unloaded by reloading');
  const before = page.events().length;
  page.click(anchor('/go/make/?source=tools-hero'));
  assert.equal(page.events().length, before, 'nothing sent after Reject');
});

test('an unrecognised data-consent value changes nothing', async () => {
  const page = await boot({ consent: null });
  page.answer('maybe');
  assert.equal(page.local.has('sa_consent'), false);
  assert.equal(page.gtagLoads().length, 0);
  assert.equal(page.banner.hidden, false);
});
