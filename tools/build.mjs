import { cp, mkdir, realpath, lstat, rm, writeFile, readdir, readFile } from 'node:fs/promises';
import { resolve, relative } from 'node:path';
import { createHash } from 'node:crypto';
import { fileURLToPath, pathToFileURL } from 'node:url';

export async function build(root = fileURLToPath(new URL('../', import.meta.url))) {
  const canonicalRoot = await realpath(root);
  const output = resolve(canonicalRoot, 'dist');
  try {
    if ((await lstat(output)).isSymbolicLink() || await realpath(output) !== output) throw new Error('Refusing to replace a redirected dist directory.');
  } catch (error) { if (error.code !== 'ENOENT') throw error; }
  if (relative(canonicalRoot, output) !== 'dist') throw new Error('Unexpected output directory.');
  // The sole recursive deletion is the verified dist directory within this workspace.
  await rm(output, { recursive: true, force: true });
  await mkdir(output);
  async function rejectLinks(path) {
    if ((await lstat(path)).isSymbolicLink()) throw new Error('Build inputs cannot be links.');
    if ((await lstat(path)).isDirectory()) for (const name of await readdir(path)) await rejectLinks(resolve(path, name));
  }
  for (const name of ['src', 'packages']) await rejectLinks(resolve(canonicalRoot, name));
  await cp(resolve(canonicalRoot, 'src'), output, { recursive: true });
  await cp(resolve(canonicalRoot, 'packages'), resolve(output, 'packages'), { recursive: true, filter: source => !source.endsWith('.md') && !source.endsWith('.d.mts') });
  const assets = [];
  async function inventory(directory) {
    for (const entry of await readdir(directory, { withFileTypes: true })) {
      const path = resolve(directory, entry.name);
      if (entry.isDirectory()) await inventory(path);
      else assets.push({ path: relative(output, path).replaceAll('\\', '/'), sha256: createHash('sha256').update(await readFile(path)).digest('hex') });
    }
  }
  await inventory(output);
  await writeFile(resolve(output, 'asset-manifest.json'), JSON.stringify({ kind: 'official-frontend-static-assets', productionIntegration: 'pending', assets }, null, 2) + '\n');
  return { output, assets };
}
if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const result = await build(); console.log(`Built ${result.assets.length} static assets into dist/. Production integration is pending.`);
}
