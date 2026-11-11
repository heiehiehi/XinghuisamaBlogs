import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { renderMarkdown } from './renderMarkdown.mjs';

test('removes scripts, event handlers, dangerous URLs and active embedded content', async () => {
  const html = await renderMarkdown(`
<script>alert(1)</script>

<img src=x onerror="alert(1)">

<svg><a href="javascript:alert(1)"><circle onload="alert(1)"></circle></a></svg>

<iframe src="https://example.com"></iframe>

[direct](javascript:alert%281%29)
[encoded](jav&#x61;script:alert%281%29)
[control](java&#x09;script:alert%281%29)
![image](javascript:alert%281%29)

[reference][bad]

[bad]: javascript:alert%281%29

<a href="javascript:alert(1)" onclick="alert(1)">raw link</a>

<a href="data:text/html,unsafe">data link</a>
  `);
  assert.doesNotMatch(html, /<script|<iframe|<svg|onerror|onclick|onload|javascript\s*:|data:text\/html/i);
});

test('preserves safe line breaks, links, GFM, math and highlighted code', async () => {
  const html = await renderMarkdown('First\n\n<br><br>\n\nSecond\n\n[link](https://example.com)\n\n~~gone~~\n\n$x^2$\n\n$$\ny=1\n$$\n\n```javascript\nconst x = 1;\n```');
  assert.match(html, /<br><br>/);
  assert.match(html, /href="https:\/\/example\.com"/);
  assert.match(html, /<del>gone<\/del>/);
  assert.match(html, /class="katex"/);
  assert.match(html, /class="katex-display"/);
  assert.match(html, /hljs-keyword/);
});

test('GFM footnote forward and back links still target sanitized IDs', async () => {
  const html = await renderMarkdown('note[^1]\n\n[^1]: hello');
  assert.match(html, /href="#user-content-user-content-fn-1"/);
  assert.match(html, /id="user-content-user-content-fn-1"/);
  assert.match(html, /href="#user-content-user-content-fnref-1"/);
  assert.match(html, /id="user-content-user-content-fnref-1"/);
});

test('keeps authored anchors working without rewriting other destinations', async () => {
  const html = await renderMarkdown([
    '[jump](#custom-note) [outside](#site-nav) [other page](/posts/other#custom-note)',
    '<h2 id="custom-note">Heading</h2>',
    '[中文锚点](#%E7%AB%A0%E8%8A%82)',
    '<h2 id="章节">章节</h2>',
  ].join('\n\n'));
  assert.match(html, /href="#user-content-custom-note"/);
  assert.match(html, /id="user-content-custom-note"/);
  assert.match(html, /href="#user-content-%E7%AB%A0%E8%8A%82"/);
  assert.match(html, /id="user-content-章节"/);
  assert.match(html, /href="#site-nav"/);
  assert.match(html, /href="\/posts\/other#custom-note"/);
});

test('preserves GFM tables and displays HTML examples as code', async () => {
  const html = await renderMarkdown('| Title | Value |\n| --- | --- |\n| Example | 42 |\n\n```html\n<img src=x onerror=alert(1)>\n```');
  assert.match(html, /<table>/);
  assert.match(html, /<td>42<\/td>/);
  assert.match(html, /<code class="hljs language-html">/);
  assert.doesNotMatch(html, /<img\b/);
});

test('all three routes use the shared sanitizer and retain their newline preprocessing', async () => {
  for (const path of ['app/about/page.tsx', 'app/chatter/[slug]/page.tsx', 'app/posts/[slug]/page.tsx']) {
    const source = await readFile(path, 'utf8');
    assert.match(source, /await renderMarkdown\(content\)/, path);
    assert.match(source, /'<br\/?>'\.repeat\(brCount\)/, path);
    assert.doesNotMatch(source, /rehypeStringify|allowDangerousHtml/, path);
  }
});
