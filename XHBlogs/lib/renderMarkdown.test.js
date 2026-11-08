import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { renderMarkdown } from './renderMarkdown.js';

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
  `);
  assert.doesNotMatch(html, /<script|<iframe|<svg|onerror|onclick|onload|javascript\s*:/i);
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

test('all three routes use the shared sanitizer and retain their newline preprocessing', async () => {
  for (const path of ['app/about/page.tsx', 'app/chatter/[slug]/page.tsx', 'app/posts/[slug]/page.tsx']) {
    const source = await readFile(path, 'utf8');
    assert.match(source, /await renderMarkdown\(content\)/, path);
    assert.match(source, /'<br\/?>'\.repeat\(brCount\)/, path);
    assert.doesNotMatch(source, /rehypeStringify|allowDangerousHtml/, path);
  }
});
