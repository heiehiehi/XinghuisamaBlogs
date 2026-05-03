import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import Link from 'next/link';

// 🌟 1. 核心升级：引入现代统一解析流 (和文章页保持绝对一致)
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkMath from 'remark-math';
import remarkRehype from 'remark-rehype';
import rehypeHighlight from 'rehype-highlight';
import rehypeStringify from 'rehype-stringify';
import rehypeKatex from 'rehype-katex';
import 'highlight.js/styles/atom-one-dark.css';

import Navbar from '../../components/Navbar';
import PageTransition from '../../components/PageTransition';
import { siteConfig } from '../../siteConfig';
import Comments from '../../components/Comments';

export default async function AboutPage() {
  const fullPath = path.join(process.cwd(), 'app', 'about', 'about.md');
  let contentHtml = "博主很懒，还没有写自我介绍哦...";
  let coverImage = "https://bu.dusays.com/2026/03/24/69c23dc278c78.jpg";

  try {
    const fileContents = fs.readFileSync(fullPath, 'utf8');
    const { data, content } = matter(fileContents);

    if (data.cover) coverImage = data.cover;

    // 🌟 2. 启用全新解析引擎：支持代码高亮
    const processedContent = await unified()
      .use(remarkParse)
      .use(remarkMath)
      .use(remarkRehype, { allowDangerousHtml: true })
      // 👇 魔法注释，直接无视 TypeScript 的类型强迫症
      // @ts-ignore
      .use(rehypeHighlight, { ignoreMissing: true })
      .use(rehypeKatex)
      .use(rehypeStringify, { allowDangerousHtml: true })
      .process(content);

    contentHtml = processedContent.toString();
  } catch (e) {
    console.error("读取 about.md 失败", e);
  }

  return (
    <div className="min-h-screen relative pb-20">
      <Navbar />

      <PageTransition>
        <main className="w-[90%] max-w-4xl mx-auto mt-28 relative z-10">
          <div className="bg-white/60 dark:bg-slate-800/50 backdrop-blur-xl rounded-[40px] shadow-2xl border border-white/40 dark:border-white/10 overflow-hidden transition-colors duration-700 relative">

            <div className="w-full h-48 md:h-64 relative bg-slate-200 dark:bg-slate-700 overflow-hidden group">
              <img src={coverImage} alt="About Hero" className="w-full h-full object-cover opacity-90 transition-transform duration-1000 group-hover:scale-105" />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 to-transparent"></div>
            </div>

            <div className="px-8 md:px-16 pb-16 relative">
              <div className="w-32 h-32 rounded-full border-4 border-white dark:border-slate-800 shadow-2xl overflow-hidden -mt-16 relative z-20 bg-white">
                <img src={siteConfig.avatarUrl} alt="avatar" className="w-full h-full object-cover" />
              </div>

              <div className="mt-6 mb-8 border-b border-slate-300/50 dark:border-slate-700 pb-8 relative">
                <h1 className="text-4xl md:text-5xl font-black text-slate-900 dark:text-white tracking-tight mb-3 transition-colors duration-700">关于我</h1>
                <p className="text-lg text-indigo-600 dark:text-indigo-400 font-bold tracking-widest uppercase transition-colors duration-700">Hello World, I'm {siteConfig.authorName}</p>

                {/* 顺手加个一键修改按钮 */}
                <Link
                  href="/editor?type=about"
                  className="absolute top-0 right-0 p-3 rounded-2xl bg-white/50 dark:bg-slate-800/50 text-slate-600 dark:text-slate-300 hover:bg-indigo-500 hover:text-white transition-all shadow-sm border border-slate-200 dark:border-slate-700 group flex items-center gap-2 active:scale-95 z-50"
                >
                  <span className="text-lg">✏️</span>
                  <span className="text-sm font-bold hidden group-hover:inline-block">修改此页</span>
                </Link>
              </div>

              {/* 🌟 3. 核心修复区：审美 1:1 同步 */}
              <div className="relative">
                <style>{`
                  /* 代码块美化 */
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

                  /* 标题和正文排版 */
                  .prose h1 { font-size: 3rem !important; font-weight: 950 !important; margin-bottom: 2rem !important; margin-top: 3rem !important; line-height: 1.1 !important; color: inherit !important; }
                  .prose h2 { font-size: 2.2rem !important; font-weight: 800 !important; margin-bottom: 1.5rem !important; margin-top: 2rem !important; color: inherit !important; }
                  .prose h3 { font-size: 1.5rem !important; font-weight: 700 !important; margin-bottom: 1rem !important; color: inherit !important; }
                  .prose p { font-size: 1.15rem !important; line-height: 1.85 !important; color: inherit !important; }
                  .prose ul { list-style-type: disc !important; padding-left: 1.5rem !important; }
                  .prose ol { list-style-type: decimal !important; padding-left: 1.5rem !important; }
                  
                  /* 图片特效同步 */
                  .prose img { 
                    display: block !important; 
                    margin: 2rem auto !important; 
                    border-radius: 2rem !important; 
                    box-shadow: 0 20px 50px rgba(0,0,0,0.15) !important; 
                    max-width: 100% !important; 
                    height: auto !important; 
                  }
                `}</style>

                {/* 去掉了之前繁杂的 tailwind 覆盖，全权交给 CSS */}
                <div
                  className="prose prose-slate dark:prose-invert prose-lg max-w-none text-slate-800 dark:text-slate-200 font-serif transition-colors duration-700 leading-relaxed scroll-smooth"
                  dangerouslySetInnerHTML={{ __html: contentHtml }}
                />
              </div>

              {/* 👇 评论区：放置在正文的最下方 */}
              <div className="mt-16">
                <Comments />
              </div>

            </div>
          </div>
        </main>
      </PageTransition>
    </div>
  );
}