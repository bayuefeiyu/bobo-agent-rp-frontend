import assert from 'node:assert/strict';
import { readFile, readdir, lstat } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { resolve, relative } from 'node:path';
import { operations, definitions } from '../packages/rp-web-contract/operations.mjs';
import { validateSchema } from '../packages/rp-web-contract/index.mjs';
import { scenarios } from '../fixtures/scenarios.mjs';
import { inventory } from './contract-inventory.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
const upstream = JSON.parse(await readFile(resolve(root, 'UPSTREAM.json'), 'utf8'));
const allowed = new Set(upstream.files.map(file => file.path));
for (const file of upstream.files) {
  const bytes = await readFile(resolve(root, file.path));
  assert.equal(createHash('sha256').update(bytes).digest('hex'), file.sha256, `Fixed public dependency changed: ${file.path}`);
}
async function checkPackages(directory) {
  for (const entry of await readdir(directory)) {
    const path = resolve(directory, entry); const stat = await lstat(path);
    assert.equal(stat.isSymbolicLink(), false, 'No linked upstream sources');
    if (stat.isDirectory()) await checkPackages(path);
    else assert.ok(allowed.has(relative(root, path).replaceAll('\\', '/')), `Unexpected public dependency: ${entry}`);
  }
}
await checkPackages(resolve(root, 'packages'));
assert.equal(new Set(operations.map(o => o.id)).size, operations.length);
const features = new Set();
for (const scenario of scenarios) {
  validateSchema(definitions.State, scenario.state, scenario.id, definitions);
  for (const id of scenario.features) features.add(id);
}
for (let i = 1; i <= 14; i++) assert.ok(features.has(`F${String(i).padStart(2, '0')}`));
await inventory({ check: true });
console.log(`Verified ${upstream.files.length} fixed public files, ${operations.length} operations, ${scenarios.length} synthetic scenarios and F01–F14 design coverage.`);
