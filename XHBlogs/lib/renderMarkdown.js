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

// The sanitizer prefixes IDs to prevent DOM clobbering. GFM footnote links
// already use their own prefix, so keep their fragment targets in sync.
function fixFootnoteLinks() {
  return (tree) => {
    function visit(node) {
      if (node.type === 'element' && node.tagName === 'a' &&
          (node.properties.dataFootnoteRef != null || node.properties.dataFootnoteBackref != null) &&
          typeof node.properties.href === 'string' && node.properties.href.startsWith('#user-content-')) {
        node.properties.href = '#user-content-' + node.properties.href.slice(1);
      }
      if (node.children) node.children.forEach(visit);
    }
    visit(tree);
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
    .use(fixFootnoteLinks)
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
