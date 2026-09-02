// Tests for the /go/* cloak resolver. This is the revenue path: every case
// here is a way a click could stop earning, so the assertions are about the
// Location header a partner actually receives.
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { onRequest } from './[[slug]].js';
import { CLOAKS, sanitiseSource } from './_cloaks.js';

const NEXT = Symbol('next');
const call = (path, slug) =>
  onRequest({
    params: { slug },
    request: new Request(`https://stackarchitect.xyz${path}`),
    next: async () => NEXT,
  });

describe('/go/* cloak resolver', () => {
  it('redirects a bare cloak to the declared destination, untouched', async () => {
    const res = await call('/go/make', ['make']);
    assert.equal(res.status, 302);
    assert.equal(res.headers.get('location'), CLOAKS.make.destination);
  });

  it('handles the trailing-slash variant identically', async () => {
    // /go/* is exempt from middleware slash-adding, so both shapes arrive here
    // and the catch-all yields a trailing empty segment for one of them.
    const res = await call('/go/make/', ['make', '']);
    assert.equal(res.status, 302);
    assert.equal(res.headers.get('location'), CLOAKS.make.destination);
  });

  it('merges ?source= into the destination without losing the referral param', async () => {
    const res = await call('/go/make/?source=stocky-shutdown-step2', ['make']);
    const url = new URL(res.headers.get('location'));
    assert.equal(url.searchParams.get('pc'), 'techie123', 'referral credential must survive');
    assert.equal(url.searchParams.get('source'), 'stocky-shutdown-step2');
  });

  it('preserves a destination whose referral param is the only query', async () => {
    const res = await call('/go/systeme/?source=index-grid', ['systeme']);
    const url = new URL(res.headers.get('location'));
    assert.ok(url.searchParams.get('sa').startsWith('sa0274'), 'sa= must survive');
    assert.equal(url.searchParams.get('source'), 'index-grid');
  });

  it('adds nothing to a destination with no query string of its own', async () => {
    const res = await call('/go/tidio/?source=stack-row', ['tidio']);
    const url = new URL(res.headers.get('location'));
    assert.equal(url.origin + url.pathname, CLOAKS.tidio.destination);
    assert.equal(url.searchParams.get('source'), 'stack-row');
  });

  it('falls through to _redirects for an unknown slug', async () => {
    assert.equal(await call('/go/not-a-partner', ['not-a-partner']), NEXT);
  });

  it('falls through rather than throwing when params are malformed', async () => {
    assert.equal(await call('/go/', [undefined]), NEXT);
  });

  it('drops a source that sanitises to nothing instead of sending an empty param', async () => {
    const res = await call('/go/make/?source=%2F%2F%3C%3E', ['make']);
    assert.equal(res.headers.get('location'), CLOAKS.make.destination);
  });

  it('never overwrites a param the network already set', async () => {
    // Guards the case where a future destination carries its own `source`.
    const withSource = { destination: 'https://example.com/?source=network', subidParam: 'source' };
    const saved = CLOAKS['tidio-ai'];
    CLOAKS['tidio-ai'] = withSource;
    try {
      const res = await call('/go/tidio-ai/?source=ours', ['tidio-ai']);
      assert.equal(new URL(res.headers.get('location')).searchParams.get('source'), 'network');
    } finally {
      CLOAKS['tidio-ai'] = saved;
    }
  });
});

describe('sanitiseSource', () => {
  it('lowercases and keeps only safe characters', () => {
    assert.equal(sanitiseSource('Stocky-Shutdown_Step2.a'), 'stocky-shutdown_step2.a');
    assert.equal(sanitiseSource('a b/c?d=e&f'), 'abcdef');
  });

  it('caps length and rejects non-strings', () => {
    assert.equal(sanitiseSource('a'.repeat(200)).length, 64);
    assert.equal(sanitiseSource(null), '');
    assert.equal(sanitiseSource(undefined), '');
  });
});
