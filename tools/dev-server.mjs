import { createServer } from 'node:http';
import { readFile, realpath } from 'node:fs/promises';
import { resolve, relative, extname, isAbsolute, sep } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { randomUUID } from 'node:crypto';
import { parseArgs } from 'node:util';
import { matchOperation } from '../packages/rp-web-contract/operations.mjs';
import { RpWebError } from '../packages/rp-web-contract/index.mjs';
import { createMockService } from './mock-service.mjs';

export const repositoryRoot = fileURLToPath(new URL('../', import.meta.url));
const types = { '.html': 'text/html; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.json': 'application/json; charset=utf-8', '.css': 'text/css; charset=utf-8', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.woff2': 'font/woff2' };
const within = (root, path) => { const rel = relative(root, path); return !isAbsolute(rel) && rel !== '..' && !rel.startsWith(`..${sep}`); };
export function backendOrigin(value) {
  const url = new URL(value);
  if (url.protocol !== 'http:' || !['127.0.0.1', 'localhost', '[::1]'].includes(url.hostname) || url.username || url.password || url.pathname !== '/' || url.search || url.hash) throw new Error('Backend must be an explicit loopback HTTP origin.');
  return url.origin;
}
async function readBody(request) {
  let size = 0; const chunks = [];
  for await (const chunk of request) {
    size += chunk.length;
    if (size > 8 * 1024 * 1024) throw new RpWebError('request_too_large', 'Development request exceeds 8 MiB.');
    chunks.push(chunk);
  }
  return Buffer.concat(chunks);
}
function parseJson(buffer) {
  try { return buffer.length ? JSON.parse(buffer.toString('utf8')) : undefined; }
  catch { throw new RpWebError('invalid_request', 'Invalid JSON.'); }
}
function json(response, status, payload) {
  response.writeHead(status, { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store', 'x-content-type-options': 'nosniff' });
  response.end(JSON.stringify(payload));
}
async function staticFile(pathname, root, built) {
  const decoded = decodeURIComponent(pathname);
  if (decoded.includes('\\') || decoded.includes('\0') || decoded.split('/').some(part => part.startsWith('.'))) return null;
  const assets = resolve(root, built ? 'dist' : 'src');
  const publicPackages = !built && decoded.startsWith('/packages/');
  const base = publicPackages ? resolve(root, 'packages') : assets;
  const suffix = publicPackages ? decoded.slice('/packages/'.length) : decoded === '/' ? 'index.html' : decoded.slice(1);
  const candidate = resolve(base, suffix);
  if (!within(base, candidate) || !types[extname(candidate)]) return null;
  try {
    const canonicalBase = await realpath(base), canonicalPath = await realpath(candidate);
    if (!within(canonicalBase, canonicalPath)) return null;
    return { body: await readFile(canonicalPath), type: types[extname(candidate)] };
  } catch (error) { if (['ENOENT', 'EISDIR', 'ENOTDIR'].includes(error.code)) return null; throw error; }
}
export async function startDevServer({ port = 4317, service = 'play', backend = null, scenario = 'empty', built = false, root = repositoryRoot } = {}) {
  if (!['play', 'launcher'].includes(service)) throw new Error('service must be play or launcher.');
  if (!Number.isInteger(port) || port < 0 || port > 65535) throw new Error('Invalid port.');
  const target = backend ? backendOrigin(backend) : null;
  let launcherCookie = '';
  if (target) {
    const discovery = await fetch(`${target}/api/v1/connection`, { redirect: 'manual', signal: AbortSignal.timeout(10000) });
    if (!discovery.ok || !discovery.headers.get('content-type')?.includes('application/json')) throw new Error('Backend connection discovery failed.');
    const connection = (await discovery.json()).data;
    if (service === 'launcher' ? connection?.mode !== 'launcher' : !['play', 'development'].includes(connection?.mode)) throw new Error('Backend mode differs from --service.');
    if (service === 'launcher') {
      const bootstrap = await fetch(`${target}/`, { redirect: 'manual', signal: AbortSignal.timeout(10000) });
      const cookie = bootstrap.headers.getSetCookie().find(value => value.startsWith('rp-launcher='));
      await bootstrap.body?.cancel(); // Never expose or persist the old launcher document.
      if (!bootstrap.ok || !cookie) throw new Error('Launcher session bootstrap failed.');
      launcherCookie = cookie.split(';')[0];
    }
  }
  const mock = target ? null : createMockService({ service, scenario });
  let origin;
  const server = createServer(async (request, response) => {
    const requestId = randomUUID();
    response.setHeader('x-request-id', requestId);
    try {
      const local = new URL(origin);
      if (request.headers.host !== local.host || request.headers.origin && request.headers.origin !== origin) throw new RpWebError('forbidden', 'Host or Origin differs from the development server.');
      if (!request.url?.startsWith('/') || request.url.startsWith('//')) throw new RpWebError('invalid_request', 'Invalid request path.');
      const url = new URL(request.url, origin);
      if (url.pathname.startsWith('/__dev/')) {
        if (!mock) throw new RpWebError('not_found', 'Synthetic controls are unavailable in live mode.');
        if (request.method === 'GET' && url.pathname === '/__dev/scenarios') return json(response, 200, { scenarios: mock.list() });
        if (request.method === 'POST' && url.pathname === '/__dev/scenario') { mock.reset(parseJson(await readBody(request))?.id); return json(response, 200, { ok: true }); }
        if (request.method === 'POST' && url.pathname === '/__dev/fault') { mock.setFault(parseJson(await readBody(request))?.kind); return json(response, 200, { ok: true }); }
        throw new RpWebError('not_found', 'Unknown synthetic control.');
      }
      if (url.pathname.startsWith('/api/')) {
        const operation = matchOperation(request.method, url.pathname);
        if (!operation) throw new RpWebError('not_found', 'Only declared public API routes are available.');
        const body = ['GET', 'HEAD'].includes(request.method) ? null : await readBody(request);
        if (mock) {
          const result = mock.execute(operation, url, body ? parseJson(body) : undefined);
          if (result.drop) { response.destroy(); return; }
          return json(response, 200, { data: result.data, requestId, readContext: result.readContext });
        }
        const headers = { accept: request.headers.accept || 'application/json', origin: target };
        for (const key of ['content-type', 'x-rp-config-token', 'range']) if (request.headers[key]) headers[key] = request.headers[key];
        if (launcherCookie) headers.cookie = launcherCookie;
        const upstream = await fetch(`${target}${url.pathname}${url.search}`, { method: request.method, headers, body, redirect: 'manual', signal: AbortSignal.timeout(60000) });
        const contentType = upstream.headers.get('content-type') || '';
        if (upstream.status >= 300 && upstream.status < 400 || contentType.includes('text/html') || operation.response !== 'binary' && !contentType.includes('application/json')) {
          await upstream.body?.cancel();
          throw new RpWebError('internal_error', 'Upstream returned a redirect or unexpected content; old pages are never proxied.', { status: 502 });
        }
        const output = Buffer.from(await upstream.arrayBuffer());
        response.writeHead(upstream.status, { 'content-type': contentType || 'application/octet-stream', 'cache-control': 'no-store', 'content-length': output.length, 'x-content-type-options': 'nosniff' });
        response.end(output); return;
      }
      if (request.method !== 'GET' && request.method !== 'HEAD') throw new RpWebError('method_not_allowed', 'Static assets are read only.');
      const file = await staticFile(url.pathname, root, built);
      if (!file) throw new RpWebError('not_found', 'No local asset at this path.');
      response.writeHead(200, { 'content-type': file.type, 'cache-control': 'no-store', 'x-content-type-options': 'nosniff' });
      response.end(request.method === 'HEAD' ? undefined : file.body);
    } catch (error) {
      if (response.destroyed) return;
      const known = error instanceof RpWebError;
      json(response, known ? error.status : 500, { error: { code: known ? error.code : 'internal_error', message: known ? error.message : 'Development server request failed.', details: known ? error.details : null, retryable: false }, requestId });
    }
  });
  await new Promise((resolveListen, reject) => { server.once('error', reject); server.listen(port, '127.0.0.1', resolveListen); });
  origin = `http://127.0.0.1:${server.address().port}`;
  return { origin, server, close: () => new Promise((resolveClose, reject) => { server.close(error => error ? reject(error) : resolveClose()); server.closeIdleConnections(); }) };
}
if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const { values } = parseArgs({ options: { port: { type: 'string', default: '4317' }, service: { type: 'string', default: 'play' }, backend: { type: 'string' }, scenario: { type: 'string', default: 'empty' }, built: { type: 'boolean', default: false } } });
  const instance = await startDevServer({ ...values, port: Number(values.port) });
  console.log(`Independent frontend: ${instance.origin}/ (${values.backend ? 'live API proxy' : 'synthetic'} ${values.service})`);
  for (const signal of ['SIGINT', 'SIGTERM']) process.once(signal, () => { void instance.close(); });
}
