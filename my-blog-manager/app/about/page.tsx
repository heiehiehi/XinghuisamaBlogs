import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import Link from 'next/link';
import { Suspense } from 'react';

// 🌟 1. 核心升级：引入现代统一解析流
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkMath from 'remark-math';
import remarkRehype from 'remark-rehype';
import rehypeHighlight from 'rehype-highlight';
import rehypeStringify from 'rehype-stringify';
import rehypeKatex from 'rehype-katex';
import 'highlight.js/styles/atom-one-dark.css';
import 'katex/dist/katex.min.css';

import Navbar from '../../components/Navbar';
import PageTransition from '../../components/PageTransition';
import { siteConfig } from '../../siteConfig';

// 🌟 引入刚刚写好的前端交互引擎
import AboutClient from '../../components/AboutClient';

// 🌟 读取指定目录下的 markdown 文件，并提取属性
function getDirActivities(dirName: string, typeLabel: '文章' | '杂谈' | '说说', linkPrefix: string) {
  const dirPath = path.join(process.cwd(), dirName);
  if (!fs.existsSync(dirPath)) return [];

  const files = fs.readdirSync(dirPath).filter(f => f.endsWith('.md'));

  return files.map(file => {
    const content = fs.readFileSync(path.join(dirPath, file), 'utf8');
    const { data } = matter(content);
    return {
      id: `${dirName}-${file}`,
      type: typeLabel,
      title: data.title || file.replace('.md', ''),
      // 保留完整 ISO 时间供前端处理
      date: data.date ? new Date(data.date).toISOString() : '1970-01-01T00:00:00Z',
      url: `/${linkPrefix}/${file.replace('.md', '')}`
    };
  });
}

export default async function AdminAboutPage() {
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
      // @ts-ignore
      .use(rehypeHighlight, { ignoreMissing: true })
      .use(rehypeKatex)
      .use(rehypeStringify, { allowDangerousHtml: true })
      .process(content);

    contentHtml = processedContent.toString();
  } catch (e) {
    console.error("读取 about.md 失败", e);
  }

  // 🌟 3. 获取所有的活动动态
  const posts = getDirActivities('posts', '文章', 'posts');
  const chatters = getDirActivities('chatters', '杂谈', 'chatter');
  const moments = getDirActivities('moments', '说说', 'moments');

  // 将所有动态合并，并按时间倒序排列 (最新的在最上面)
  const allActivities = [...posts, ...chatters, ...moments].sort((a, b) => {
    return new Date(b.date).getTime() - new Date(a.date).getTime();
  });

  return (
    <div className="min-h-screen relative pb-20">
      <Navbar />

      <PageTransition>
        <main className="w-[95%] md:w-[90%] max-w-4xl mx-auto mt-24 md:mt-28 relative z-10">

          {/* 🌟 4. 控制台专属：悬浮在整个海报右上角的“一键修改”特权按钮 */}
          <div className="absolute top-4 right-4 md:top-6 md:right-8 z-50">
            <Link
              href="/editor?type=about"
              className="p-2.5 md:px-4 md:py-2.5 rounded-xl md:rounded-2xl bg-white/30 dark:bg-slate-900/40 backdrop-blur-md text-slate-800 dark:text-slate-100 hover:bg-indigo-500 hover:text-white dark:hover:bg-indigo-500 transition-all shadow-lg border border-white/50 dark:border-white/10 group flex items-center gap-2 active:scale-95"
            >
              <span className="text-base md:text-lg">✏️</span>
              <span className="text-xs md:text-sm font-bold hidden md:inline-block group-hover:inline-block">修改此页</span>
            </Link>
          </div>

          {/* 🌟 5. 载入前端互动引擎 */}
          <Suspense fallback={
            <div className="h-96 flex flex-col gap-4 items-center justify-center text-slate-500 font-bold bg-white/40 dark:bg-slate-800/40 rounded-[40px] animate-pulse">
              <span className="text-3xl">📡</span>
              正在连线源石数据库...
            </div>
          }>
            <AboutClient
              contentHtml={contentHtml}
              coverImage={coverImage}
              activities={allActivities}
            />
          </Suspense>

        </main>
      </PageTransition>
    </div>
  );
}