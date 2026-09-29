// Client code for the Apps Script error explainer (#explainer) in the quotas
// post. Matching, causes, fixes and limits all come from the
// apps-script-quotas package, which is checked against Google's quotas page
// daily, so a new release reaches this page on the next dependency upgrade.
//
// Privacy: a pasted error never leaves the browser. This file makes no
// network request and sends no analytics; tests/client-tools-privacy.test.js
// checks it and its bundle.
import { explain, get, type Row } from 'apps-script-quotas';

const $ = <T extends HTMLElement>(id: string) => document.getElementById(id) as T | null;

function el<K extends keyof HTMLElementTagNameMap>(tag: K, cls?: string, text?: string) {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (text != null) e.textContent = text;
  return e;
}

/** Comparable size of a limit: seconds for time limits, the number otherwise. */
const size = (l: Row['consumer']) => (l.seconds ?? l.value ?? 0);

/** The package links to absolute stackarchitect.xyz URLs; on this site they
    become paths, and a link to this page becomes a fragment. */
function localHref(url: string) {
  const path = url.replace(/^https:\/\/stackarchitect\.xyz/, '');
  const [p, hash] = path.split('#');
  if (p === window.location.pathname) return hash ? `#${hash}` : '';
  return path;
}

function linkLabel(href: string) {
  if (href.startsWith('#')) {
    const h = document.getElementById(href.slice(1));
    return h?.textContent?.trim() || 'the section above';
  }
  if (href.startsWith('/blog/google-sheets-custom-function-errors/')) return 'Google Sheets custom function errors';
  return 'Google Apps Script quotas explained';
}

function explainError() {
  const input = $<HTMLTextAreaElement>('qx-input');
  const out = $('qx-result');
  if (!input || !out) return;

  const message = input.value.trim();
  if (!message) {
    out.replaceChildren();
    return;
  }

  const res = explain(message, 'consumer');
  if (!res) {
    out.replaceChildren(el('p', 'qx-miss',
      'No match. This explainer knows the quota and limit errors Google documents; for other errors, see the table above.'));
    return;
  }

  const rows = res.limits
    .map((l) => get(l.id))
    .filter((r, i, all): r is Row => r !== null && all.findIndex((x) => x?.id === r.id) === i);

  const parts: HTMLElement[] = [];
  parts.push(el('h4', 'qx-head', 'Cause'), el('p', undefined, res.cause));

  if (rows.length) {
    parts.push(el('h4', 'qx-head', 'The limit'));
    const table = el('table', 'comparison-table qx-table');
    const head = el('tr');
    head.append(el('th', undefined, 'Limit'), el('th', undefined, 'Consumer'), el('th', undefined, 'Google Workspace'));
    const thead = el('thead');
    thead.append(head);
    const tbody = el('tbody');
    for (const r of rows) {
      const tr = el('tr');
      tr.append(el('td', undefined, r.feature), el('td', undefined, r.consumer.raw), el('td', undefined, r.workspace.raw));
      tbody.append(tr);
    }
    table.append(thead, tbody);
    parts.push(table);

    // Only when Workspace really is higher for the matched limit: the
    // six-minute runtime, for one, is the same on both.
    const higher = rows.find((r) => size(r.workspace) > size(r.consumer));
    if (higher) {
      const p = el('p', 'qx-workspace');
      const a = el('a', undefined, 'Google Workspace account');
      a.setAttribute('href', '/go/workspace/?source=quotas-explainer-workspace');
      a.setAttribute('rel', 'sponsored nofollow');
      p.append('A ', a, ` raises this to ${higher.workspace.raw}.`);
      parts.push(p);
    }
  }

  parts.push(el('h4', 'qx-head', 'Fix'), el('p', undefined, res.fix));

  // The package points quota errors at this post as a whole; send the reader
  // to the section that answers this error instead.
  let guide = localHref(res.guide);
  if (guide === '') {
    guide = /too many times in a short time/i.test(message) ? '#service-invoked-too-many-times'
      : rows.some((r) => r.kind === 'daily') ? '#daily-quotas'
      : rows.length ? '#hard-limitations'
      : '#stay-under';
  }
  const links = [guide, res.alsoSee ? localHref(res.alsoSee) : ''].filter(Boolean);
  const more = el('p', 'qx-more');
  more.append('Read more: ');
  links.forEach((href, i) => {
    if (i) more.append(', and ');
    const a = el('a', undefined, linkLabel(href));
    a.setAttribute('href', href);
    more.append(a);
  });
  more.append('.');
  parts.push(more);

  out.replaceChildren(...parts);
}

function init() {
  const root = $('qx-app');
  if (!root || root.dataset.ready) return;
  root.dataset.ready = '1';
  root.hidden = false;
  $('qx-explain')?.addEventListener('click', explainError);
  $('qx-input')?.addEventListener('input', explainError);
}

document.addEventListener('astro:page-load', init);
init();
