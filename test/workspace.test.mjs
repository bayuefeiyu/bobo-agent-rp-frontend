import test from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { mkdtemp, cp, rm, readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { resolve, relative } from 'node:path';
import { startDevServer, backendOrigin, repositoryRoot } from '../tools/dev-server.mjs';
import { createRpClient } from '../packages/rp-web-client/index.mjs';
import { build } from '../tools/build.mjs';

async function useServer(t, options) {
  const app = await startDevServer({ port: 0, ...options });
  t.after(() => app.close()); return app;
}
const control = (origin, path, body) => fetch(`${origin}/__dev/${path}`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) });

test('isolated mock supports SDK opening/input/revision and preserves drafts on conflict', async t => {
  const app = await useServer(t);
  const client = createRpClient({ baseUrl: app.origin }); t.after(() => client.dispose());
  const connection = await client.connect();
  assert.equal(connection.mode, 'play');
  assert.equal(client.readContext.chatId, null);
  assert.equal((await client.chat.state()).messages.length, 0);
  await client.chat.opening({ openingId: 'arrival', playerName: '测试旅人' });
  assert.equal(client.readContext.chatId, 'synthetic-chat');
  await client.chat.input({ content: '敲门', operationId: 'input-one' });
  await client.chat.input({ content: '敲门', operationId: 'input-one' });
  assert.equal((await client.chat.state()).messages.length, 3);
  await assert.rejects(client.chat.input({ content: '其他内容', operationId: 'input-one' }), { code: 'invalid_request' });
  const draft = { content: '门里传来脚步声。', operationId: 'edit-one', expectedRevision: 1 };
  await client.request('messages/2', { method: 'PUT', body: draft });
  await assert.rejects(client.request('messages/2', { method: 'PUT', body: { ...draft, operationId: 'edit-two' } }), { code: 'revision_conflict' });
  assert.equal(draft.content, '门里传来脚步声。');
  assert.equal((await client.chat.state()).messages[2].revision, 2);
  assert.equal(connection.capabilities.includes('get.config.profiles'), false);
  await assert.rejects(client.request('config/profiles'), { code: 'unsupported_capability' });
});

test('scenario reset invalidates old context, busy state rejects input, preview rejects writes', async t => {
  const app = await useServer(t, { scenario: 'ready' });
  const one = createRpClient({ baseUrl: app.origin }), two = createRpClient({ baseUrl: app.origin });
  t.after(() => { one.dispose(); two.dispose(); });
  await one.connect(); await two.connect();
  one.preview('synthetic-candidate');
  await assert.rejects(one.chat.input({ content: '继续', operationId: 'preview-input' }), { code: 'preview_read_only' });
  assert.equal(two.readContext.executionId, null);
  assert.equal((await two.chat.state()).busy, false);
  assert.equal((await control(app.origin, 'scenario', { id: 'busy' })).status, 200);
  await assert.rejects(two.chat.state(), { code: 'session_changed' });
  await two.connect();
  assert.equal((await two.chat.state()).busy, true);
  await assert.rejects(two.chat.input({ content: '继续', operationId: 'busy-input' }), { code: 'invalid_state' });
});

test('lost response after commit is unknown outcome, not a failed or repeated input', async t => {
  const app = await useServer(t, { scenario: 'ready' });
  const client = createRpClient({ baseUrl: app.origin }); t.after(() => client.dispose());
  await client.connect();
  await control(app.origin, 'fault', { kind: 'drop-after-input' });
  await assert.rejects(client.chat.input({ content: '检查窗户', operationId: 'unknown-one' }), { code: 'operation_outcome_unknown' });
  const state = await client.chat.state();
  assert.equal(state.messages.filter(message => message.content === '检查窗户').length, 1);
  assert.equal(state.messages.length, 5);
});

test('source server exposes only local assets and refuses cross-origin commands and private files', async t => {
  const app = await useServer(t);
  const html = await (await fetch(app.origin)).text();
  assert.match(html, /连接诊断页/);
  assert.equal((await fetch(`${app.origin}/packages/rp-web-client/index.mjs`)).status, 200);
  for (const path of ['/UPSTREAM.json', '/.git/config', '/tools/dev-server.mjs', '/fixtures/scenarios.mjs', '/platform/', '/vendor/app.js', '/api/old', '/api/v1/unknown']) {
    assert.equal((await fetch(app.origin + path)).status, 404, path);
  }
  assert.equal((await fetch(`${app.origin}/api/v1/input`, { method: 'POST', headers: { origin: 'https://outside.invalid', 'content-type': 'application/json' }, body: '{}' })).status, 403);
  for (const url of ['https://127.0.0.1:99', 'http://example.com', 'http://localhost/path', 'http://user:pass@localhost', 'http://localhost/?q=1']) assert.throws(() => backendOrigin(url));
});

async function upstream(t, mode = 'launcher') {
  const seen = [];
  const server = createServer((req, res) => {
    seen.push({ method: req.method, url: req.url, cookie: req.headers.cookie, origin: req.headers.origin, token: req.headers['x-rp-config-token'] });
    if (req.url === '/') { res.writeHead(200, { 'content-type': 'text/html', 'set-cookie': 'rp-launcher=synthetic-session; HttpOnly; SameSite=Strict; Path=/' }); res.end('<html>OLD-UI-MUST-NOT-LEAK</html>'); return; }
    if (req.url.startsWith('/api/v1/state')) { res.writeHead(302, { location: '/' }); res.end(); return; }
    if (req.url.startsWith('/api/v1/card')) { res.writeHead(200, { 'content-type': 'text/html' }); res.end('OLD-UI-MUST-NOT-LEAK'); return; }
    if (req.url === '/api/v1/connection') { res.writeHead(200, { 'content-type': 'application/json' }); res.end(JSON.stringify({ data: { mode } })); return; }
    res.writeHead(200, { 'content-type': 'application/json' });
    res.end(JSON.stringify({ data: { ok: true } }));
  });
  await new Promise(resolveListen => server.listen(0, '127.0.0.1', resolveListen));
  t.after(() => new Promise(resolveClose => { server.close(resolveClose); server.closeIdleConnections(); }));
  return { origin: `http://127.0.0.1:${server.address().port}`, seen };
}

test('live launcher proxy handles session cookie without delivering old UI and blocks redirects', async t => {
  const target = await upstream(t);
  const app = await useServer(t, { service: 'launcher', backend: target.origin });
  const result = await fetch(`${app.origin}/api/v1/launch?readContext=test`, { method: 'POST', headers: { 'content-type': 'application/json', 'x-rp-config-token': 'synthetic-config', cookie: 'do-not-forward=1' }, body: JSON.stringify({ cardId: 'synthetic-card' }) });
  assert.equal(result.status, 200);
  const request = target.seen.find(entry => entry.method === 'POST');
  assert.equal(request.cookie, 'rp-launcher=synthetic-session');
  assert.equal(request.origin, target.origin);
  assert.equal(request.token, 'synthetic-config');
  assert.doesNotMatch(await (await fetch(app.origin)).text(), /OLD-UI-MUST-NOT-LEAK/);
  const before = target.seen.length;
  for (const path of ['/platform/', '/vendor/app.js', '/__dev/scenarios']) assert.equal((await fetch(app.origin + path)).status, 404);
  assert.equal(target.seen.length, before);
  for (const path of ['/api/v1/state', '/api/v1/card']) {
    const response = await fetch(app.origin + path);
    assert.equal(response.status, 502);
    assert.doesNotMatch(await response.text(), /OLD-UI-MUST-NOT-LEAK/);
  }
});

test('live mode rejects accidental connection to a different kind of service', async t => {
  const target = await upstream(t, 'play');
  await assert.rejects(startDevServer({ port: 0, service: 'launcher', backend: target.origin }), /mode differs/);
});

test('launcher mock exposes cards but never pretends to launch Pi', async t => {
  const app = await useServer(t, { service: 'launcher' });
  const client = createRpClient({ baseUrl: app.origin }); t.after(() => client.dispose());
  const connection = await client.connect();
  assert.equal(connection.mode, 'launcher');
  assert.equal((await client.request('cards')).cards.length, 2);
  await assert.rejects(client.request('launch', { method: 'POST', body: { cardId: 'synthetic-card' } }), { code: 'unsupported_capability' });
});

test('build works outside the original repository and ships no tools, fixtures or upstream UI', async t => {
  const tempRoot = await mkdtemp(resolve(tmpdir(), 'rp-independent-frontend-'));
  t.after(async () => {
    // Only delete the exact independently created temporary root.
    assert.ok(relative(tmpdir(), tempRoot).startsWith('rp-independent-frontend-'));
    await rm(tempRoot, { recursive: true, force: true });
  });
  for (const name of ['src', 'packages']) await cp(resolve(repositoryRoot, name), resolve(tempRoot, name), { recursive: true });
  const { assets } = await build(tempRoot);
  assert.ok(assets.some(item => item.path === 'index.html'));
  assert.ok(assets.some(item => item.path === 'packages/rp-web-client/index.mjs'));
  assert.ok(assets.every(item => !/^(tools|fixtures|docs)\//.test(item.path)));
  const app = await useServer(t, { root: tempRoot, built: true });
  assert.equal((await fetch(app.origin)).status, 200);
  assert.equal((await fetch(`${app.origin}/packages/rp-web-contract/index.mjs`)).status, 200);
  const manifest = JSON.parse(await readFile(resolve(tempRoot, 'dist/asset-manifest.json')));
  assert.equal(manifest.productionIntegration, 'pending');
});
