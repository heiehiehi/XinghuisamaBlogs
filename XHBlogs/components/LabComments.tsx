"use client";

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import 'gitalk/dist/gitalk.css';
import Gitalk from 'gitalk';

import { siteConfig } from '../siteConfig';

// 🌟 专门为炼金实验室定制的 Gitalk 组件，不影响原有的 Comments.tsx
export default function LabComments({ pageId }: { pageId?: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();

  useEffect(() => {
    if (!containerRef.current) return;

    // 清空之前的评论区，防止切换月份时叠加
    containerRef.current.innerHTML = '';

    // 优先使用传入的 pageId (如 workshop-2026-05)
    const finalId = (pageId || pathname.replace(/\/$/, '') || '/').substring(0, 49);

    // Gitalk 的 OAuth client secret 无法在浏览器里保密，填真实值等于公开。
    // 这里不再把它交给访客；彻底方案是把换 token 放到服务端。
    if (!siteConfig.gitalkConfig.clientID) return;

    const gitalk = new Gitalk({
      clientID: siteConfig.gitalkConfig.clientID,
      clientSecret: '',
      repo: siteConfig.gitalkConfig.repo,
      owner: siteConfig.gitalkConfig.owner,
      admin: siteConfig.gitalkConfig.admin,
      proxy: '/api/github',
      id: finalId, // 这里的 ID 决定了留言板对应 GitHub 的哪个 Issue
      distractionFreeMode: false,
    });

    gitalk.render(containerRef.current);

    // 擦除 URL 中的 OAuth 凭证，防止刷新报错
    const url = new URL(window.location.href);
    if (url.searchParams.has('code')) {
      url.searchParams.delete('code');
      window.history.replaceState({}, document.title, url.toString());
    }

  }, [pathname, pageId]);

  return (
    <div className="w-full mt-16 relative">
      <div className="absolute -top-10 left-1/2 -translate-x-1/2 w-3/4 h-32 bg-indigo-500/10 dark:bg-indigo-500/20 blur-3xl rounded-full pointer-events-none z-0"></div>
      <div ref={containerRef} className="relative z-10 custom-gitalk-glass pt-6 border-t border-slate-200/50 dark:border-slate-700/50" />

      {/* 🌟 保留你原来的毛玻璃样式 */}
      <style jsx global>{`
        .custom-gitalk-glass .gt-container .gt-header-textarea {
          background: rgba(255, 255, 255, 0.1) !important;
          backdrop-filter: blur(12px) !important;
          border: 1px solid rgba(255, 255, 255, 0.2) !important;
          border-radius: 16px !important;
          color: inherit !important;
          transition: all 0.3s ease;
        }
        .custom-gitalk-glass .gt-container .gt-header-textarea:focus {
          background: rgba(255, 255, 255, 0.2) !important;
          border-color: #6366f1 !important;
          box-shadow: 0 0 15px rgba(99, 102, 241, 0.3) !important;
        }
        .custom-gitalk-glass .gt-container .gt-header-preview {
          background: rgba(255, 255, 255, 0.1) !important;
          backdrop-filter: blur(12px) !important;
          border-radius: 16px !important;
        }
        .custom-gitalk-glass .gt-container .gt-btn {
          background: #6366f1 !important;
          border: none !important;
          border-radius: 12px !important;
          box-shadow: 0 4px 15px rgba(99, 102, 241, 0.4) !important;
          transition: transform 0.2s, box-shadow 0.2s;
          color: white !important;
        }
        .custom-gitalk-glass .gt-container .gt-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(99, 102, 241, 0.6) !important;
        }
        .custom-gitalk-glass .gt-container .gt-comment-content {
          background: rgba(255, 255, 255, 0.05) !important;
          backdrop-filter: blur(8px) !important;
          border: 1px solid rgba(255, 255, 255, 0.1) !important;
          border-radius: 16px !important;
        }
        .custom-gitalk-glass .gt-container .gt-comment-admin .gt-comment-content {
          border-color: rgba(99, 102, 241, 0.3) !important;
        }
        .custom-gitalk-glass .gt-container .gt-avatar {
          border-radius: 50% !important;
          overflow: hidden;
        }
        .custom-gitalk-glass .gt-container .gt-comment-body {
          color: inherit !important;
        }
        .custom-gitalk-glass .gt-container a {
          color: #6366f1 !important;
        }
      `}</style>
    </div>
  );
}