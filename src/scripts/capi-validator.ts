// Client code for /meta-capi-payload-validator/. The rules are not here: they
// come from the shopify-capi-validator package, so a fix released there
// reaches this page on the next dependency upgrade.
//
// Privacy: nothing pasted into this page leaves the browser. This file makes
// no network request of any kind, and tests/client-tools-privacy.test.js fails
// if it or its bundle ever names one of the browser's network APIs (the test
// holds the list, so it is not repeated here, where it would trip the test).
// The one analytics event is a count of fails and
// warnings, handed to the consent-gated tracker in Base.astro as numbers.
import { validatePayload, normalizeForMeta, type Finding } from 'shopify-capi-validator';

const $ = <T extends HTMLElement>(id: string) => document.getElementById(id) as T | null;

// ── Example: a Shopify Purchase with three deliberate mistakes ─────────────
// Test values only: example.com, the 203.0.113.0/24 documentation range, a
// drama-range UK mobile. The three mistakes are a raw email, event_time in
// milliseconds, and no event_source_url. Everything else is correct, so the
// example produces exactly three fails.
function examplePayload() {
  const nowMs = Date.now();
  const cookieMs = nowMs - 2 * 24 * 3600 * 1000;
  return {
    data: [
      {
        event_name: 'Purchase',
        event_time: nowMs,
        event_id: 'order_1001',
        action_source: 'website',
        user_data: {
          em: ['test@example.com'],
          // SHA-256 of "447700900123"
          ph: ['033134b911b137918338415ee3d20a064b24773d36a3b02e8b99fdd3fcd6b4cd'],
          // SHA-256 of "7390123456789", a Shopify customer ID
          external_id: ['8ef5d31e692df42691e40c358a07dd201ca4afecea1bf0b41af07ef2ffc940c8'],
          client_ip_address: '203.0.113.24',
          client_user_agent:
            'Mozilla/5.0 (iPhone; CPU iPhone OS 18_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.6 Mobile/15E148 Safari/604.1',
          fbc: `fb.1.${cookieMs}.IwAR0exampleClickId`,
          fbp: `fb.1.${cookieMs}.1234567890`,
        },
        custom_data: {
          currency: 'GBP',
          value: 42.5,
          content_type: 'product',
          content_ids: ['8123456789012'],
          num_items: 1,
          order_id: '1001',
        },
      },
    ],
  };
}

// ── Invalid JSON: where is the error? ──────────────────────────────────────
// Browsers word JSON.parse errors differently and Safari gives no position at
// all, so the position comes from this small scanner instead. It only finds
// where the text stops being JSON; JSON.parse still does the parsing.
export function jsonErrorOffset(s: string): number {
  let i = 0;
  const stop = (): never => { throw i; };
  const ws = () => { while (i < s.length && ' \t\n\r'.includes(s[i])) i++; };
  const str = () => {
    i++;
    while (i < s.length) {
      const c = s[i];
      if (c === '"') { i++; return; }
      if (c === '\\') {
        i++;
        if (i >= s.length) stop();
        if (s[i] === 'u') {
          if (!/^[0-9a-fA-F]{4}$/.test(s.slice(i + 1, i + 5))) stop();
          i += 5;
          continue;
        }
        if (!'"\\/bfnrt'.includes(s[i])) stop();
        i++;
        continue;
      }
      if (c < ' ') stop();
      i++;
    }
    stop();
  };
  const value = (): void => {
    ws();
    const c = s[i];
    if (c === '{') {
      i++; ws();
      if (s[i] === '}') { i++; return; }
      for (;;) {
        ws();
        if (s[i] !== '"') stop();
        str(); ws();
        if (s[i] !== ':') stop();
        i++; value(); ws();
        if (s[i] === ',') { i++; continue; }
        if (s[i] === '}') { i++; return; }
        stop();
      }
    }
    if (c === '[') {
      i++; ws();
      if (s[i] === ']') { i++; return; }
      for (;;) {
        value(); ws();
        if (s[i] === ',') { i++; continue; }
        if (s[i] === ']') { i++; return; }
        stop();
      }
    }
    if (c === '"') return str();
    const num = /^-?(0|[1-9]\d*)(\.\d+)?([eE][+-]?\d+)?/.exec(s.slice(i));
    if (num) { i += num[0].length; return; }
    for (const w of ['true', 'false', 'null']) if (s.startsWith(w, i)) { i += w.length; return; }
    stop();
  };
  try {
    value(); ws();
    if (i < s.length) stop();
    return -1;
  } catch (e) {
    return typeof e === 'number' ? e : -1;
  }
}

export function lineAndColumn(s: string, offset: number) {
  const before = s.slice(0, offset);
  const line = before.split('\n').length;
  const column = offset - before.lastIndexOf('\n');
  return { line, column };
}

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

function el<K extends keyof HTMLElementTagNameMap>(tag: K, cls?: string, text?: string) {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (text != null) e.textContent = text;
  return e;
}

// Every string from the payload reaches the page through textContent, never
// innerHTML: a pasted event is untrusted text.
function findingList(items: Finding[], cls: string) {
  const ul = el('ul', `cv-list ${cls}`);
  for (const f of items) {
    const li = el('li');
    li.append(el('span', 'cv-msg', f.msg));
    if (f.hint) li.append(el('span', 'cv-hint', f.hint));
    ul.append(li);
  }
  return ul;
}

function showMessage(out: HTMLElement, summary: HTMLElement, text: string) {
  out.replaceChildren(el('p', 'cv-error', text));
  summary.textContent = '';
}

function check() {
  const input = $<HTMLTextAreaElement>('cv-input');
  const out = $('cv-results');
  const summary = $('cv-summary');
  if (!input || !out || !summary) return;

  const text = input.value.trim();
  if (!text) {
    showMessage(out, summary, 'Paste a payload first, or press Load example.');
    return;
  }

  let payload: unknown;
  try {
    payload = JSON.parse(text);
  } catch (e) {
    const at = jsonErrorOffset(text);
    const where = at >= 0 ? lineAndColumn(text, at) : null;
    const reason = e instanceof Error ? e.message : String(e);
    showMessage(out, summary, where
      ? `Invalid JSON at line ${where.line}, column ${where.column}. ${reason}`
      : `Invalid JSON. ${reason}`);
    return;
  }

  let events: { findings: Finding[] }[];
  try {
    if (payload === null || typeof payload !== 'object') throw new Error('not an object');
    events = validatePayload(payload, { platform: 'meta' }).events;
  } catch {
    showMessage(out, summary, 'This is valid JSON but not an event. Paste {"data":[...]}, an array of events, or one event object.');
    return;
  }
  if (events.length === 0) {
    showMessage(out, summary, 'No events found: the data array is empty.');
    return;
  }

  const eventNames = (() => {
    const p = payload as { data?: unknown[] } | unknown[];
    const list = Array.isArray(p) ? p : Array.isArray((p as { data?: unknown[] }).data) ? (p as { data: unknown[] }).data : [p];
    return list.map((e) => (e && typeof e === 'object' && typeof (e as { event_name?: unknown }).event_name === 'string')
      ? (e as { event_name: string }).event_name : '');
  })();

  let fails = 0, warnings = 0, passed = 0;
  const blocks = events.map(({ findings }, i) => {
    const f = findings.filter((x) => x.level === 'fail');
    const w = findings.filter((x) => x.level === 'warn');
    const p = findings.filter((x) => x.level === 'pass');
    fails += f.length; warnings += w.length; passed += p.length;

    const section = el('section', 'cv-event');
    const name = eventNames[i] ? `: ${eventNames[i]}` : '';
    section.append(el('h3', 'cv-event-title', `Event ${i + 1}${name}`));
    section.append(el('p', 'cv-event-count',
      `${plural(f.length, 'fail', 'fails')}, ${plural(w.length, 'warning', 'warnings')}, ${p.length} passed`));
    if (f.length) {
      section.append(el('h4', 'cv-head cv-head-fail', 'Fails'));
      section.append(findingList(f, 'cv-fail'));
    }
    if (w.length) {
      section.append(el('h4', 'cv-head cv-head-warn', 'Warnings'));
      section.append(findingList(w, 'cv-warn'));
    }
    if (p.length) {
      const d = el('details', 'cv-passed');
      d.append(el('summary', undefined, `Passed (${p.length})`));
      d.append(findingList(p, 'cv-pass'));
      section.append(d);
    }
    return section;
  });

  out.replaceChildren(...blocks);
  const across = events.length > 1 ? ` across ${events.length} events` : '';
  summary.textContent =
    `${plural(fails, 'fail', 'fails')}, ${plural(warnings, 'warning', 'warnings')}, ${passed} passed${across}`;
  summary.dataset.state = fails ? 'fail' : warnings ? 'warn' : 'pass';

  // Counts only. Base.astro's tracker drops it unless the visitor accepted
  // analytics, and passes on nothing but the tool name and numbers.
  document.dispatchEvent(new CustomEvent('sa:tool', { detail: { tool: 'capi_validator', fails, warnings } }));
}

// ── Hash helper ────────────────────────────────────────────────────────────
async function sha256Hex(text: string) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

let hashRun = 0;
async function hash() {
  const field = $<HTMLSelectElement>('hh-field');
  const input = $<HTMLInputElement>('hh-value');
  const normOut = $('hh-normalised');
  const hashOut = $('hh-hash');
  const note = $('hh-note');
  if (!field || !input || !normOut || !hashOut || !note) return;

  const run = ++hashRun;
  const raw = input.value;
  note.textContent = field.value === 'ph' && raw.includes('(0)')
    ? 'This number contains (0), a national prefix. Remove it before hashing: see the UK phone trap below.'
    : '';
  if (!raw.trim()) {
    normOut.textContent = '';
    hashOut.textContent = '';
    return;
  }
  const normalised = normalizeForMeta(field.value, raw);
  const digest = normalised ? await sha256Hex(normalised) : '';
  if (run !== hashRun) return; // a later keystroke already wrote its result
  normOut.textContent = normalised;
  hashOut.textContent = digest;
}

// Without JavaScript the page hides both tools with a noscript style, so a
// visitor sees the rules, tables and FAQ rather than buttons that do nothing.
function init() {
  const roots = [$('cv-tools'), $('hh-tool')].filter((r): r is HTMLElement => r !== null);
  if (roots.length === 0 || roots[0].dataset.ready) return;
  for (const r of roots) {
    r.dataset.ready = '1';
    r.hidden = false;
  }

  $('cv-check')?.addEventListener('click', check);
  $('cv-example')?.addEventListener('click', () => {
    const input = $<HTMLTextAreaElement>('cv-input');
    if (!input) return;
    input.value = JSON.stringify(examplePayload(), null, 2);
    input.focus();
  });
  $('hh-field')?.addEventListener('change', hash);
  $('hh-value')?.addEventListener('input', hash);
}

document.addEventListener('astro:page-load', init);
init();
