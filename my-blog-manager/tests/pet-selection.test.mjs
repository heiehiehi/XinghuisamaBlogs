import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { test } from 'node:test';
import ts from 'typescript';

const route = await fs.readFile(new URL('../app/api/pet-selection/route.ts', import.meta.url), 'utf8');
const { outputText } = ts.transpileModule(route, {
  compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext },
});
const { GET, POST } = await import('data:text/javascript;base64,' + Buffer.from(outputText).toString('base64'));
const host = '127.0.0.1:3220';
const origin = 'http://' + host;

function request(activePet, from = origin) {
  return new Request(origin + '/api/pet-selection', activePet === undefined ? {
    headers: { host },
  } : {
    method: 'POST',
    headers: { host, origin: from, 'Content-Type': 'application/json' },
    body: JSON.stringify({ activePet }),
  });
}

test('switches either way on the configured blog and preserves existing content', async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'xh-pets-'));
  const previous = process.env.XHS_MANAGER_ROOT;
  const manager = path.join(root, 'manager');
  const site = path.join(root, '博客网站');
  const assets = path.join(site, 'public/pets/xhblogs-big-fish');
  const config = path.join(site, 'data/petSelection.json');
  const preserved = new Map([
    [path.join(site, 'data/friends.ts'), 'existing friends'],
    [path.join(site, 'posts/existing.md'), 'existing article'],
    [path.join(site, 'public/pets/custom.webm'), 'existing custom animation'],
    [path.join(site, 'siteConfig.ts'), 'existing site config'],
  ]);
  try {
    process.env.XHS_MANAGER_ROOT = manager;
    await fs.mkdir(path.join(manager, 'data'), { recursive: true });
    await fs.writeFile(path.join(manager, 'data/deploy_config.json'), JSON.stringify({ blogPath: site }));
    await fs.mkdir(assets, { recursive: true });
    await fs.mkdir(path.dirname(config), { recursive: true });
    await fs.writeFile(config, '{"activePet":"coal"}');
    for (const [file, text] of preserved) {
      await fs.mkdir(path.dirname(file), { recursive: true });
      await fs.writeFile(file, text);
    }
    assert.deepEqual(await (await GET(request())).json(), { activePet: 'coal' });
    assert.equal((await POST(request('big-fish'))).status, 409);
    assert.equal((await POST(request('both'))).status, 400);
    assert.equal((await POST(request('coal', 'https://outside.example'))).status, 403);
    await fs.writeFile(path.join(assets, 'idle.webm'), 'idle fixture');
    await fs.writeFile(path.join(assets, 'happy.webm'), 'happy fixture');
    for (const activePet of ['big-fish', 'coal']) {
      const result = await POST(request(activePet));
      assert.equal(result.status, 200);
      assert.deepEqual(await (await GET(request())).json(), { activePet });
      assert.deepEqual(JSON.parse(await fs.readFile(config, 'utf8')), { activePet });
    }
    for (const [file, text] of preserved) assert.equal(await fs.readFile(file, 'utf8'), text);
  } finally {
    if (previous === undefined) delete process.env.XHS_MANAGER_ROOT;
    else process.env.XHS_MANAGER_ROOT = previous;
    await fs.rm(root, { recursive: true, force: true });
  }
});
