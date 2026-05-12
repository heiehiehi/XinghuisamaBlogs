"use client";

import { useState, useMemo, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BookOpen, MessageSquare, Sparkles, Activity } from 'lucide-react';
import Comments from './Comments';
import { siteConfig } from '../siteConfig';
import Link from 'next/link';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';

type ActivityRecord = {
  id: string;
  type: '文章' | '杂谈' | '说说';
  title: string;
  date: string;
  url: string;
};

export default function AboutClient({
  contentHtml,
  coverImage,
  activities
}: {
  contentHtml: string,
  coverImage: string,
  activities: ActivityRecord[]
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const activeTab = searchParams.get('tab') || 'intro';

  const handleTabChange = (tab: string) => {
    router.push(`${pathname}?tab=${tab}`, { scroll: false });
  };

  const heatmapScrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (activeTab === 'activity') {
      const checkAndScroll = setInterval(() => {
        const el = heatmapScrollRef.current;
        if (el) {
          el.scrollLeft = el.scrollWidth;
          clearInterval(checkAndScroll);

          setTimeout(() => {
            if (heatmapScrollRef.current) {
              heatmapScrollRef.current.scrollLeft = heatmapScrollRef.current.scrollWidth;
            }
          }, 300);
        }
      }, 50);

      const timeout = setTimeout(() => clearInterval(checkAndScroll), 2000);

      return () => {
        clearInterval(checkAndScroll);
        clearTimeout(timeout);
      };
    }
  }, [activeTab]);

  const formatDateTime = (dateStr: string) => {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
  };

  const getLocalDateKey = (d: Date) => {
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  };

  const { weeks, activityMap } = useMemo(() => {
    const today = new Date();
    const endDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const startDate = new Date(endDate);
    startDate.setDate(endDate.getDate() - 364);
    startDate.setDate(startDate.getDate() - startDate.getDay());

    let curr = new Date(startDate);
    const weeksArr = [];
    let currentWeek = [];

    while (curr <= endDate) {
      currentWeek.push(new Date(curr));
      if (currentWeek.length === 7) {
        weeksArr.push(currentWeek);
        currentWeek = [];
      }
      curr.setDate(curr.getDate() + 1);
    }
    if (currentWeek.length > 0) weeksArr.push(currentWeek);

    const map: Record<string, number> = {};
    activities.forEach(a => {
      const d = new Date(a.date);
      if (!isNaN(d.getTime())) {
        const dateKey = getLocalDateKey(d);
        map[dateKey] = (map[dateKey] || 0) + 1;
      }
    });

    return { weeks: weeksArr, activityMap: map };
  }, [activities]);

  const getColorClass = (count: number) => {
    if (count === 0) return 'bg-slate-100 dark:bg-slate-800/50';
    if (count === 1) return 'bg-green-300 dark:bg-green-900/80';
    if (count === 2) return 'bg-green-400 dark:bg-green-700/80';
    if (count === 3) return 'bg-green-500 dark:bg-green-600';
    return 'bg-green-600 dark:bg-green-500';
  };

  const getTypeColor = (type: string) => {
    switch(type) {
      case '文章': return 'text-indigo-600 dark:text-indigo-400';
      case '杂谈': return 'text-purple-600 dark:text-purple-400';
      case '说说': return 'text-pink-600 dark:text-pink-400';
      default: return 'text-slate-500 dark:text-slate-400';
    }
  };

  return (
    <div className="bg-white/60 dark:bg-slate-800/50 backdrop-blur-xl rounded-[40px] shadow-2xl border border-white/40 dark:border-white/10 overflow-hidden transition-colors duration-700 relative">

      <div className="w-full h-40 sm:h-48 md:h-64 relative bg-slate-200 dark:bg-slate-700 overflow-hidden group">
        <img src={coverImage} alt="About Hero" className="w-full h-full object-cover opacity-90 transition-transform duration-1000 group-hover:scale-105" />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 to-transparent"></div>
      </div>

      <div className="px-5 sm:px-8 md:px-16 pb-10 md:pb-16 relative">
        <div className="w-24 h-24 md:w-32 md:h-32 rounded-full border-4 border-white dark:border-slate-800 shadow-2xl overflow-hidden -mt-12 md:-mt-16 relative z-20 bg-white">
          <img src={siteConfig.avatarUrl} alt="avatar" className="w-full h-full object-cover" />
        </div>

        {/* 🌟 核心修复区：手机端排版优雅适配 */}
        <div className="mt-4 md:mt-6 mb-6 md:mb-8 relative flex flex-col md:flex-row md:items-end justify-between gap-5 md:gap-4">
          <div className="text-center md:text-left">
            <h1 className="text-3xl md:text-5xl font-black text-slate-900 dark:text-white tracking-tight mb-1 md:mb-3 transition-colors duration-700">关于我</h1>
            <p className="text-sm md:text-lg text-indigo-600 dark:text-indigo-400 font-bold tracking-widest uppercase transition-colors duration-700">Hello World, I'm {siteConfig.authorName}</p>
          </div>

          <div className="flex items-center w-full md:w-auto gap-1 bg-white/50 dark:bg-slate-900/50 p-1 md:p-1.5 rounded-xl md:rounded-2xl shadow-inner border border-white/40 dark:border-white/5">
            <button
              onClick={() => handleTabChange('intro')}
              className={`flex-1 md:flex-none px-4 md:px-6 py-2 md:py-2 rounded-lg md:rounded-xl text-xs md:text-sm font-black transition-all duration-300 ${activeTab === 'intro' ? 'bg-indigo-500 text-white shadow-md' : 'text-slate-500 hover:text-indigo-500'}`}
            >
              自我介绍
            </button>
            <button
              onClick={() => handleTabChange('activity')}
              className={`flex-1 md:flex-none px-4 md:px-6 py-2 md:py-2 rounded-lg md:rounded-xl text-xs md:text-sm font-black transition-all duration-300 ${activeTab === 'activity' ? 'bg-indigo-500 text-white shadow-md' : 'text-slate-500 hover:text-indigo-500'}`}
            >
              研究动态
            </button>
          </div>
        </div>

        <div className="w-full h-px bg-slate-300/50 dark:bg-slate-700 mb-6 md:mb-8"></div>

        <AnimatePresence mode="wait">
          {activeTab === 'intro' && (
            <motion.div key="intro" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.3 }}>
              <div className="relative">
                <style>{`
                  .prose h1 { font-size: 1.8rem !important; font-weight: 900 !important; margin-bottom: 1.2rem !important; margin-top: 2rem !important; line-height: 1.3 !important; color: inherit !important; }
                  .prose h2 { font-size: 1.5rem !important; font-weight: 800 !important; margin-bottom: 1rem !important; margin-top: 1.5rem !important; color: inherit !important; }
                  .prose h3 { font-size: 1.2rem !important; font-weight: 700 !important; margin-bottom: 0.8rem !important; color: inherit !important; }
                  .prose p { font-size: 0.95rem !important; line-height: 1.75 !important; color: inherit !important; }
                  .prose ul, .prose ol { padding-left: 1.2rem !important; font-size: 0.95rem !important; }

                  .prose pre {
                    background-color: #282c34 !important; color: #abb2bf !important;
                    padding: 1rem !important; border-radius: 0.75rem !important;
                    overflow-x: auto !important; box-shadow: inset 0 0 10px rgba(0,0,0,0.3) !important;
                    margin-top: 1rem !important; margin-bottom: 1rem !important;
                  }
                  
                  .prose pre code, .prose p code, .prose li code { 
                    font-family: 'JetBrains Mono', 'Fira Code', 'Cascadia Code', 'Source Code Pro', Menlo, Consolas, ui-monospace, monospace !important; 
                    font-variant-ligatures: contextual !important; 
                  }
                  .prose pre code { 
                    background-color: transparent !important; 
                    padding: 0 !important; 
                    color: inherit !important; 
                    font-size: 0.85em !important; 
                  }
                  
                  .prose code::before, .prose code::after { content: none !important; }
                  .prose p code, .prose li code { background-color: rgba(99, 102, 241, 0.1) !important; color: #6366f1 !important; padding: 0.1rem 0.3rem !important; border-radius: 0.25rem !important; font-weight: 600 !important; font-size: 0.85em !important; }
                  .dark .prose p code, .dark .prose li code { background-color: rgba(99, 102, 241, 0.2) !important; color: #818cf8 !important; }
                  .prose img { display: block !important; margin: 1.5rem auto !important; border-radius: 1rem !important; box-shadow: 0 10px 30px rgba(0,0,0,0.1) !important; max-width: 100% !important; height: auto !important; }

                  .prose pre code .hljs-comment, .prose pre code .hljs-quote { color: #5c6370 !important; font-style: italic !important; }
                  .prose pre code .hljs-doctag, .prose pre code .hljs-keyword, .prose pre code .hljs-formula { color: #c678dd !important; }
                  .prose pre code .hljs-section, .prose pre code .hljs-name, .prose pre code .hljs-selector-tag, .prose pre code .hljs-deletion, .prose pre code .hljs-subst { color: #e06c75 !important; }
                  .prose pre code .hljs-literal { color: #56b6c2 !important; }
                  .prose pre code .hljs-string, .prose pre code .hljs-regexp, .prose pre code .hljs-addition, .prose pre code .hljs-attribute, .prose pre code .hljs-meta-string { color: #98c379 !important; }
                  .prose pre code .hljs-built_in, .prose pre code .hljs-class .hljs-title { color: #e6c07b !important; }
                  .prose pre code .hljs-attr, .prose pre code .hljs-variable, .prose pre code .hljs-template-variable, .prose pre code .hljs-type, .prose pre code .hljs-selector-class, .prose pre code .hljs-selector-attr, .prose pre code .hljs-selector-pseudo, .prose pre code .hljs-number { color: #d19a66 !important; }
                  .prose pre code .hljs-symbol, .prose pre code .hljs-bullet, .prose pre code .hljs-link, .prose pre code .hljs-meta, .prose pre code .hljs-selector-id, .prose pre code .hljs-title { color: #61aeee !important; }

                  @media (min-width: 768px) {
                    .prose h1 { font-size: 3rem !important; font-weight: 950 !important; margin-bottom: 2rem !important; margin-top: 3rem !important; line-height: 1.1 !important; }
                    .prose h2 { font-size: 2.2rem !important; margin-bottom: 1.5rem !important; margin-top: 2rem !important; }
                    .prose p { font-size: 1.15rem !important; }
                    .prose pre { padding: 1.25rem !important; margin-top: 1.5rem !important; margin-bottom: 1.5rem !important; }
                    .prose pre code { font-size: 0.9em !important; }
                  }
                `}</style>
                <div className="prose prose-slate dark:prose-invert prose-base md:prose-lg max-w-none text-slate-800 dark:text-slate-200 font-serif transition-colors duration-700 leading-relaxed scroll-smooth" dangerouslySetInnerHTML={{ __html: contentHtml }} />
              </div>
              <div className="mt-12 md:mt-16"><Comments /></div>
            </motion.div>
          )}

          {activeTab === 'activity' && (
            <motion.div key="activity" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.3 }}>

              <div className="mb-12 p-5 md:p-8 bg-slate-50/50 dark:bg-slate-900/30 rounded-3xl border border-slate-200/50 dark:border-white/5 shadow-inner">
                <h3 className="text-lg font-black text-slate-800 dark:text-white mb-6 flex items-center gap-2">
                  <Activity size={20} className="text-green-500" />
                  {activities.length} contributions in the last year
                </h3>

                <div className="flex gap-2">

                  <div className="flex flex-col shrink-0">
                    <div className="h-4 mb-1"></div>
                    <div className="flex flex-col gap-[4px] text-[10px] text-slate-400">
                      <div className="h-[11px] md:h-[13px]"></div>
                      <div className="h-[11px] md:h-[13px] leading-none flex items-center">Mon</div>
                      <div className="h-[11px] md:h-[13px]"></div>
                      <div className="h-[11px] md:h-[13px] leading-none flex items-center">Wed</div>
                      <div className="h-[11px] md:h-[13px]"></div>
                      <div className="h-[11px] md:h-[13px] leading-none flex items-center">Fri</div>
                      <div className="h-[11px] md:h-[13px]"></div>
                    </div>
                  </div>

                  <div ref={heatmapScrollRef} className="flex-1 overflow-x-auto pb-4 custom-scrollbar scroll-smooth relative">
                    <div className="min-w-[700px]">

                      <div className="flex gap-[4px] text-[10px] text-slate-400 mb-1 h-4">
                        {weeks.map((week, idx) => {
                          const firstDay = week[0];
                          const isFirstWeekOfMonth = firstDay.getDate() <= 7;
                          return (
                            <div key={idx} className="w-[11px] md:w-[13px] shrink-0 relative">
                              {isFirstWeekOfMonth && (
                                <span className="absolute left-0 whitespace-nowrap z-10">
                                  {firstDay.toLocaleString('en-US', { month: 'short' })}
                                </span>
                              )}
                            </div>
                          );
                        })}
                      </div>

                      <div className="flex gap-[4px]">
                        {weeks.map((week, i) => (
                          <div key={i} className="flex flex-col gap-[4px]">
                            {week.map((day, j) => {
                              const dateKey = getLocalDateKey(day);
                              const count = activityMap[dateKey] || 0;
                              return (
                                <div
                                  key={j}
                                  title={`${dateKey}: ${count} 次更新`}
                                  className={`w-[11px] h-[11px] md:w-[13px] md:h-[13px] rounded-[3px] transition-colors duration-300 hover:ring-2 hover:ring-indigo-500/50 ${getColorClass(count)}`}
                                ></div>
                              );
                            })}
                          </div>
                        ))}
                      </div>

                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 mt-2 text-[10px] md:text-xs font-bold text-slate-500">
                  Less
                  <div className="w-[11px] h-[11px] rounded-[3px] bg-slate-100 dark:bg-slate-800/50"></div>
                  <div className="w-[11px] h-[11px] rounded-[3px] bg-green-300 dark:bg-green-900/80"></div>
                  <div className="w-[11px] h-[11px] rounded-[3px] bg-green-400 dark:bg-green-700/80"></div>
                  <div className="w-[11px] h-[11px] rounded-[3px] bg-green-500 dark:bg-green-600"></div>
                  <div className="w-[11px] h-[11px] rounded-[3px] bg-green-600 dark:bg-green-500"></div>
                  More
                </div>
              </div>

              <div className="relative pl-6 md:pl-8 border-l-2 border-indigo-500/20 dark:border-indigo-400/20 space-y-6 md:space-y-8">
                {activities.map((act, index) => {
                  const isMoment = act.type === '说说';
                  const targetUrl = isMoment ? '/moments' : act.url;

                  return (
                    <div key={index} className="relative group">
                      <div className="absolute -left-[31px] md:-left-[39px] top-1/2 -translate-y-1/2 w-3 h-3 md:w-4 md:h-4 bg-white dark:bg-slate-800 border-2 border-indigo-500 rounded-full group-hover:scale-125 transition-transform duration-300 z-10"></div>

                      <Link
                        href={targetUrl}
                        className="flex flex-col md:flex-row md:items-center gap-3 bg-white/60 dark:bg-slate-800/60 backdrop-blur-md p-4 rounded-2xl border border-white/50 dark:border-white/5 shadow-sm hover:shadow-lg transition-all group-hover:-translate-y-1 cursor-pointer block relative overflow-hidden"
                      >
                        <div className="flex items-center gap-3 w-full md:w-auto">
                          <img src={siteConfig.avatarUrl} alt="author" className="w-8 h-8 md:w-10 md:h-10 rounded-full border-2 border-white dark:border-slate-700 shadow-sm shrink-0" />

                          <div className="flex flex-col flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-black text-slate-800 dark:text-slate-200 text-sm">{siteConfig.authorName}</span>
                              <span className={`text-xs font-bold ${getTypeColor(act.type)}`}>
                                {isMoment ? '发布了 说说' : `更新了 ${act.type}`}
                              </span>
                            </div>

                            <div className="text-[10px] md:hidden font-mono text-slate-400 mt-0.5">
                              {formatDateTime(act.date)}
                            </div>
                          </div>
                        </div>

                        {!isMoment && (
                          <>
                            <div className="hidden md:block w-px h-8 bg-slate-300 dark:bg-slate-600 mx-2 shrink-0"></div>
                            <div className="flex-1 min-w-0">
                              <div className="text-sm md:text-base font-black text-slate-800 dark:text-white truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                                《{act.title}》
                              </div>
                            </div>
                          </>
                        )}

                        {isMoment && (
                          <div className="flex-1 hidden md:block"></div>
                        )}

                        <div className="hidden md:block text-[11px] font-mono text-slate-400 shrink-0 ml-auto bg-slate-100 dark:bg-slate-900/50 px-2 py-1 rounded-md">
                          {formatDateTime(act.date)}
                        </div>
                      </Link>
                    </div>
                  );
                })}

                {activities.length === 0 && (
                  <div className="text-slate-500 text-sm font-bold">源石数据库中暂无活动记录...</div>
                )}
              </div>

            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </div>
  );
}