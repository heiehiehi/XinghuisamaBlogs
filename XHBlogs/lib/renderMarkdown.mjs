import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import remarkRehype from 'remark-rehype';
import rehypeRaw from 'rehype-raw';
import rehypeSanitize, { defaultSchema } from 'rehype-sanitize';
import rehypeHighlight from 'rehype-highlight';
import rehypeKatex from 'rehype-katex';
import rehypeStringify from 'rehype-stringify';

// Sanitize untrusted HTML before trusted plugins generate KaTeX and highlighting.
// Keep the classes consumed by those plugins, not arbitrary HTML attributes.
const schema = {
  ...defaultSchema,
  attributes: {
    ...defaultSchema.attributes,
    code: [
      ...(defaultSchema.attributes?.code || []),
      ['className', 'math-inline', 'math-display', /^language-./],
    ],
    span: [
      ...(defaultSchema.attributes?.span || []),
      ['className', 'math', 'math-inline', 'math-display'],
    ],
  },
};

// Keep fragment links to this document working after the sanitizer prefixes
// IDs. Do not rewrite links to other pages or IDs outside the Markdown.
function fixFragmentLinks() {
  return (tree) => {
    const prefix = schema.clobberPrefix;
    const ids = new Set();
    const links = [];
    function visit(node) {
      if (node.type === 'element') {
        const { id, href } = node.properties;
        if (typeof id === 'string' && id.startsWith(prefix)) ids.add(id);
        if (node.tagName === 'a' && typeof href === 'string' && href.startsWith('#') && href.length > 1) {
          links.push(node);
        }
      }
      if (node.children) node.children.forEach(visit);
    }
    visit(tree);
    for (const link of links) {
      let fragment = link.properties.href.slice(1);
      try {
        fragment = decodeURIComponent(fragment);
      } catch {
        // Keep malformed escapes literal.
      }
      const id = prefix + fragment;
      if (ids.has(id)) link.properties.href = '#' + encodeURIComponent(id);
    }
  };
}

export async function renderMarkdown(content) {
  const processed = await unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkMath)
    .use(remarkRehype, { allowDangerousHtml: true })
    .use(rehypeRaw)
    .use(rehypeSanitize, schema)
    .use(fixFragmentLinks)
    .use(rehypeHighlight, {
      detect: true,
      ignoreMissing: true,
      subset: ['cpp', 'c', 'python', 'java', 'javascript', 'typescript', 'go', 'rust', 'bash', 'json', 'html', 'css', 'sql', 'xml'],
    })
    .use(rehypeKatex)
    .use(rehypeStringify)
    .process(content);
  return processed.toString();
}
