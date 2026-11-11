import fs from 'node:fs/promises';
import path from 'node:path';
import { randomUUID } from 'node:crypto';

export const runtime = 'nodejs';

const headers = { 'Cache-Control': 'no-store' };
const reply = (body: unknown, status = 200) => Response.json(body, { status, headers });
const localHost = /^(?:localhost|127\.0\.0\.1|\[::1\])(?::\d+)?$/;
const isMissing = (error: unknown) => (error as NodeJS.ErrnoException)?.code === 'ENOENT';

async function siteSelectionPath() {
  const root = path.resolve(process.env.XHS_MANAGER_ROOT || process.cwd());
  const settings = await fs.readFile(path.join(root, 'data/deploy_config.json'), 'utf8')
    .then(raw => JSON.parse(raw), error => { if (!isMissing(error)) throw error; return {}; });
  const configured = typeof settings?.blogPath === 'string' ? settings.blogPath.trim() : '';
  const website = await fs.realpath(configured ? path.resolve(root, configured) : path.resolve(root, '../XHBlogs'));
  const filename = path.join(website, 'data/petSelection.json');
  const actual = await fs.realpath(filename);
  if (path.relative(filename, actual) || !(await fs.stat(actual)).isFile()) throw new Error('Invalid site');
  return { website, filename };
}

export async function GET(request: Request) {
  if (!localHost.test(request.headers.get('host') ?? '')) return reply({ detail: '请在本机控制台操作。' }, 403);
  try {
    const { filename } = await siteSelectionPath();
    const value = JSON.parse(await fs.readFile(filename, 'utf8'));
    return reply({ activePet: value?.activePet === 'big-fish' ? 'big-fish' : 'coal' });
  } catch {
    return reply({ detail: '找不到博客宠物配置。请检查仓库设置中的网站路径，并先更新网站源码。' }, 409);
  }
}

export async function POST(request: Request) {
  const host = request.headers.get('host') ?? '';
  if (!localHost.test(host) || request.headers.get('origin') !== new URL(request.url).protocol + '//' + host) {
    return reply({ detail: '只允许从本机控制台保存。' }, 403);
  }
  const data = await request.json().catch(() => null);
  const activePet: unknown = data?.activePet;
  if (activePet !== 'coal' && activePet !== 'big-fish') return reply({ detail: '请选择煤球或大肥鱼。' }, 400);

  let temporary: string | undefined;
  try {
    const { website, filename } = await siteSelectionPath();
    if (activePet === 'big-fish') {
      try {
        for (const asset of ['idle.webm', 'happy.webm']) {
          if (!(await fs.stat(path.join(website, 'public/pets/xhblogs-big-fish', asset))).isFile()) throw new Error();
        }
      } catch {
        return reply({ detail: '博客目录缺少大肥鱼动画。请先更新网站源码，再切换。' }, 409);
      }
    }
    temporary = path.join(path.dirname(filename), `.pet-selection-${randomUUID()}.tmp`);
    await fs.writeFile(temporary, JSON.stringify({ activePet }, null, 2) + '\n', { flag: 'wx' });
    await fs.rename(temporary, filename);
    return reply({ activePet });
  } catch {
    return reply({ detail: '未能保存。请确认博客目录已更新且可以写入。' }, 409);
  } finally {
    if (temporary) await fs.unlink(temporary).catch(() => {});
  }
}
