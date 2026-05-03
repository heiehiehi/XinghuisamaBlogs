import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import Link from 'next/link';

import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkRehype from 'remark-rehype';
import rehypeHighlight from 'rehype-highlight';
import rehypeStringify from 'rehype-stringify';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';

// 引入高亮主题
import 'highlight.js/styles/atom-one-dark.css';

import Navbar from '../../../components/Navbar';
import PageTransition from '../../../components/PageTransition';
import { siteConfig } from '../../../siteConfig';
import ClientSocials from '../../../components/ClientSocials';
import ClientTOC from '../../../components/ClientTOC';
import BackButton from '../../../components/BackButton';
import Comments from '../../../components/Comments';
import SidebarLyric from '../../../components/SidebarLyric';

export async function generateStaticParams() {
  const postsDirectory = path.join(process.cwd(), 'posts');
  if (!fs.existsSync(postsDirectory)) return [];

  const filenames = fs.readdirSync(postsDirectory);

  return filenames
    .filter((name) => name.endsWith('.md'))
    .map((name) => ({
      slug: name.replace(/\.md$/, ''),
    }));
}

function extractToc(content: string) {
  const headingRegex = /^(#{1,3})\s+(.+)$/gm;
  const toc = [];
  let match;
  while ((match = headingRegex.exec(content)) !== null) {
    toc.push({
      level: match[1].length,
      text: match[2].trim(),
      id: match[2].trim().toLowerCase().replace(/\s+/g, '-')
    });
  }
  return toc;
}

async function getPostData(slug: string) {
  const fullPath = path.join(process.cwd(), 'posts', `${slug}.md`);
  const fileContents = fs.readFileSync(fullPath, 'utf8');
  const { data, content } = matter(fileContents);

  const processedContent = await unified()
    .use(remarkParse)
    .use(remarkMath)
    .use(remarkRehype, { allowDangerousHtml: true })
    .use(rehypeHighlight, { ignoreMissing: true })
    .use(rehypeKatex)
    .use(rehypeStringify, { allowDangerousHtml: true })
    .process(content);

  return {
    slug,
    contentHtml: processedContent.toString(),
    toc: extractToc(content),
    title: data.title,
    date: data.date,
    tags: data.tags && Array.isArray(data.tags) ? data.tags : [],
    cover: data.cover || siteConfig.defaultPostCover
  };
}

function getRecentPosts(currentSlug: string) {
  const postsDirectory = path.join(process.cwd(), 'posts');
  let fileNames: string[] = [];
  try { fileNames = fs.readdirSync(postsDirectory).filter(f => f.endsWith('.md')); } catch(e) {}
  if (!fileNames) return [];
  return fileNames.map(f => {
    const s = f.replace(/\.md$/, '');
    const c = fs.readFileSync(path.join(postsDirectory, f), 'utf8');
    const { data } = matter(c);
    return { slug: s, title: data.title || '无标题', date: data.date };
  }).filter(p => p.slug !== currentSlug).slice(0, 3);
}

export default async function Post({ params }: { params: Promise<{ slug: string }> }) {
  const resolvedParams = await params;
  const postData = await getPostData(resolvedParams.slug);
  const recentPosts = getRecentPosts(resolvedParams.slug);

  return (
    <div className="min-h-screen relative pb-20">
      <Navbar />
      <PageTransition>
        <main className="w-[90%] max-w-6xl mx-auto mt-28 flex flex-col lg:flex-row gap-8 relative z-10">

          <article className="flex-1 bg-white/60 dark:bg-slate-800/50 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/40 dark:border-white/10 overflow-hidden transition-colors duration-700">
            <div className="w-full aspect-video bg-slate-200 dark:bg-slate-700 relative group">
              <img src={postData.cover} alt="封面" className="w-full h-full object-cover opacity-90 transition-transform duration-1000 group-hover:scale-105" />
            </div>

            <div className="p-8 md:p-12 relative">
              <BackButton />

              <header className="mb-8 border-b border-slate-300/50 dark:border-slate-700 pb-6 relative">
                <h1 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white mb-4 tracking-tight transition-colors duration-700 pr-24">
                  {postData.title}
                </h1>

                <Link
                  href={`/editor?id=${postData.slug}&type=post`}
                  className="absolute top-0 right-0 p-3 rounded-2xl bg-white/50 dark:bg-slate-800/50 text-slate-600 dark:text-slate-300 hover:bg-indigo-500 hover:text-white transition-all shadow-sm border border-slate-200 dark:border-slate-700 group flex items-center gap-2 active:scale-95 z-50"
                >
                  <span className="text-lg">✏️</span>
                  <span className="text-sm font-bold hidden group-hover:inline-block">修改此篇</span>
                </Link>

                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex items-center gap-2 text-indigo-700 dark:text-indigo-400 font-bold bg-white/30 dark:bg-slate-900/50 px-4 py-2 rounded-full w-max text-sm transition-colors duration-700 shadow-sm border border-white/20 dark:border-white/5">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    写作时间：{postData.date}
                  </div>

                  {postData.tags.map((tag: string) => (
                    <div key={tag} className="flex items-center gap-1 text-pink-600 dark:text-pink-400 font-bold bg-white/30 dark:bg-slate-900/50 px-3 py-2 rounded-full text-sm transition-colors duration-700 shadow-sm border border-white/20 dark:border-white/5">
                      <span className="text-xs opacity-70">#</span> {tag}
                    </div>
                  ))}
                </div>
              </header>

              {/* 🌟 核心修复区：把编辑器的排版审美 1:1 复制过来，打通前后端任督二脉 */}
              <div className="relative">
                <style>{`
                  /* 1. 代码块美化（保留原有的） */
                  .prose pre {
                    background-color: #282c34 !important;
                    color: #abb2bf !important;
                    padding: 1.25rem !important;
                    border-radius: 0.75rem !important;
                    overflow-x: auto !important;
                    box-shadow: inset 0 0 10px rgba(0,0,0,0.3) !important;
                    margin-top: 1.5rem !important;
                    margin-bottom: 1.5rem !important;
                  }
                  .prose pre code {
                    background-color: transparent !important;
                    padding: 0 !important;
                    color: inherit !important;
                    font-size: 0.9em !important;
                    font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace !important;
                  }
                  .prose code::before, .prose code::after { content: none !important; }
                  .prose p code, .prose li code {
                    background-color: rgba(99, 102, 241, 0.1) !important;
                    color: #6366f1 !important;
                    padding: 0.2rem 0.4rem !important;
                    border-radius: 0.375rem !important;
                    font-weight: 600 !important;
                  }
                  .dark .prose p code, .dark .prose li code { background-color: rgba(99, 102, 241, 0.2) !important; color: #818cf8 !important; }

                  /* 2. 标题和正文排版（从编辑器 1:1 抄过来的心血） */
                  .prose h1 { font-size: 3rem !important; font-weight: 950 !important; margin-bottom: 2rem !important; margin-top: 3rem !important; line-height: 1.1 !important; color: inherit !important; }
                  .prose h2 { font-size: 2.2rem !important; font-weight: 800 !important; margin-bottom: 1.5rem !important; margin-top: 2rem !important; color: inherit !important; }
                  .prose h3 { font-size: 1.5rem !important; font-weight: 700 !important; margin-bottom: 1rem !important; color: inherit !important; }
                  .prose p { font-size: 1.15rem !important; line-height: 1.85 !important; color: inherit !important; }
                  .prose ul { list-style-type: disc !important; padding-left: 1.5rem !important; }
                  .prose ol { list-style-type: decimal !important; padding-left: 1.5rem !important; }
                  
                  /* 3. 图片特效同步（让文章里的图片和编辑器里一样带大圆角和极客阴影） */
                .prose img { 
                  display: block !important; 
                  margin: 2rem auto !important; 
                  border-radius: 2rem !important; 
                  box-shadow: 0 20px 50px rgba(0,0,0,0.15) !important; 
                  max-width: 100% !important; /* ✅ 改成 max-width，防止溢出，同时尊重行内尺寸 */
                  height: auto !important; 
                }
                `}</style>

                <div
                  id="article-content"
                  className="prose prose-slate dark:prose-invert prose-lg max-w-none text-slate-800 dark:text-slate-200 transition-colors duration-700 scroll-smooth"
                  dangerouslySetInnerHTML={{ __html: postData.contentHtml }}
                />
              </div>

              <div className="mt-16">
                <Comments />
              </div>

            </div>
          </article>

          <aside className="w-full lg:w-[320px] flex flex-col gap-6 flex-shrink-0">
            <div className="bg-white/60 dark:bg-slate-800/50 backdrop-blur-xl rounded-3xl p-6 border border-white/40 dark:border-white/10 shadow-xl text-center">
              <div className="w-20 h-20 mx-auto rounded-full p-1 bg-gradient-to-tr from-indigo-500 to-purple-500 shadow-md mb-4 transition-transform duration-500 hover:rotate-3">
                <img src={siteConfig.avatarUrl} alt="avatar" className="w-full h-full rounded-full object-cover bg-white" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">{siteConfig.authorName}</h3>
              <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-medium mb-4">{siteConfig.bio}</p>
              <ClientSocials />
            </div>

            <SidebarLyric />

            <div className="bg-white/60 dark:bg-slate-800/50 backdrop-blur-xl rounded-3xl p-6 border border-white/40 dark:border-white/10 shadow-xl">
              <h3 className="font-black text-slate-900 dark:text-white mb-4 border-l-4 border-indigo-500 pl-2 text-sm">RECOMMENDED</h3>
              <div className="space-y-4">
                {recentPosts.map(p => (
                  <Link key={p.slug} href={`/posts/${p.slug}`} className="group block">
                    <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors line-clamp-1">{p.title}</h4>
                    <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1 font-bold uppercase">{p.date}</p>
                  </Link>
                ))}
              </div>
            </div>

            {postData.toc.length > 0 && (
              <ClientTOC toc={postData.toc} />
            )}
          </aside>
        </main>
      </PageTransition>
    </div>
  );
}