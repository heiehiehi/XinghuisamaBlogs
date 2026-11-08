"use client";

import { useEffect, useRef } from 'react';
import 'gitalk/dist/gitalk.css';
import Gitalk from 'gitalk';
import { siteConfig } from '../siteConfig';

interface MomentCommentsProps {
  id: string; // 必须传入说说的专属 ID
}

export default function MomentComments({ id }: MomentCommentsProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // 清空重载，防止 React 严格模式下重复渲染
    containerRef.current.innerHTML = '';

    // Gitalk 的 OAuth client secret 无法在浏览器里保密，填真实值等于公开。
    // 这里不再把它交给访客；彻底方案是把换 token 放到服务端。
    if (!siteConfig.gitalkConfig.clientID) return;

    const gitalk = new Gitalk({
      clientID: siteConfig.gitalkConfig.clientID,
      clientSecret: '',
      repo: siteConfig.gitalkConfig.repo,
      owner: siteConfig.gitalkConfig.owner,
      admin: siteConfig.gitalkConfig.admin,
      // 截取前49个字符作为 GitHub Issue 的 Label（Gitalk 的要求）
      id: id.substring(0, 49),
      distractionFreeMode: false,
    });

    gitalk.render(containerRef.current);
  }, [id]);

  return (
    <div className="w-full relative">
      <div ref={containerRef} className="moment-gitalk" />

      {/* 🌟 朋友圈级专属魔改 CSS：极简、紧凑、无边框 */}
      <style jsx global>{`
        /* 隐藏掉一些在说说里显得太多余的 Gitalk 原生元素 */
        .moment-gitalk .gt-header-controls-tip,
        .moment-gitalk .gt-svg-svg {
          display: none !important;
        }

        /* 整体容器紧凑化 */
        .moment-gitalk .gt-container {
          padding: 0 !important;
        }

        /* 输入框区域：极简模式 */
        .moment-gitalk .gt-header {
          margin-bottom: 10px !important;
        }
        .moment-gitalk .gt-header-avatar {
          width: 28px !important;
          height: 28px !important;
          margin-top: 4px !important;
        }
        .moment-gitalk .gt-header-avatar img {
          border-radius: 6px !important;
        }
        .moment-gitalk .gt-header-comment {
          margin-left: 40px !important;
        }
        .moment-gitalk .gt-header-textarea {
          padding: 8px 12px !important;
          min-height: 40px !important; /* 默认很矮 */
          background: rgba(0, 0, 0, 0.03) !important;
          border: 1px solid transparent !important;
          border-radius: 8px !important;
          font-size: 13px !important;
          transition: all 0.3s ease !important;
          color: inherit !important;
        }
        .moment-gitalk .gt-header-textarea:focus {
          min-height: 80px !important; /* 点击后展开 */
          background: rgba(255, 255, 255, 0.8) !important;
          border-color: #6366f1 !important; /* 激活时变色 */
        }
        .dark .moment-gitalk .gt-header-textarea {
          background: rgba(255, 255, 255, 0.05) !important;
        }
        .dark .moment-gitalk .gt-header-textarea:focus {
          background: rgba(0, 0, 0, 0.5) !important;
        }

        /* 发布按钮微调 */
        .moment-gitalk .gt-btn {
          padding: 0.3em 1rem !important;
          font-size: 12px !important;
          border-radius: 6px !important;
          background: #6366f1 !important;
          border: none !important;
        }

        /* 评论列表：去边框，纯文本流 */
        .moment-gitalk .gt-comments {
          padding-top: 0 !important;
        }
        .moment-gitalk .gt-comment {
          padding: 8px 0 !important;
          margin: 0 !important;
          border-top: 1px solid rgba(0, 0, 0, 0.05) !important;
        }
        .dark .moment-gitalk .gt-comment {
          border-top: 1px solid rgba(255, 255, 255, 0.05) !important;
        }
        .moment-gitalk .gt-comment:first-child {
          border-top: none !important;
        }
        
        /* 评论头像缩小 */
        .moment-gitalk .gt-comment-avatar {
          width: 24px !important;
          height: 24px !important;
        }
        .moment-gitalk .gt-comment-avatar img {
          border-radius: 4px !important;
        }

        /* 评论内容布局 */
        .moment-gitalk .gt-comment-content {
          margin-left: 34px !important;
          padding: 0 !important;
          background: transparent !important;
          border: none !important;
          box-shadow: none !important;
        }
        
        /* 评论者名字 */
        .moment-gitalk .gt-comment-username {
          font-size: 13px !important;
          font-weight: bold !important;
          color: #576b95 !important; /* 朋友圈蓝色 */
        }
        .dark .moment-gitalk .gt-comment-username {
          color: #7f99cc !important;
        }

        /* 评论正文 */
        .moment-gitalk .gt-comment-body {
          font-size: 13px !important;
          color: inherit !important;
          padding: 2px 0 0 0 !important;
          margin-top: 0 !important;
        }
        .moment-gitalk .gt-comment-body p {
          margin: 0 !important;
        }

        /* 隐藏回复按钮等杂项，保持极简 */
        .moment-gitalk .gt-comment-like,
        .moment-gitalk .gt-comment-edit,
        .moment-gitalk .gt-comment-reply {
          display: none !important;
        }
      `}</style>
    </div>
  );
}