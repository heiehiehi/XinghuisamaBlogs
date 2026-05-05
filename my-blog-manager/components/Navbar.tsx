"use client";

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useOperations } from '../context/OperationContext';
import { useToast } from './ToastProvider';
import { AlertTriangle } from 'lucide-react';
import { siteConfig } from '../siteConfig';

export default function Navbar() {
  const [showNav, setShowNav] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [isOpBoxOpen, setIsOpBoxOpen] = useState(false);

  const [syncModalOpen, setSyncModalOpen] = useState(false);
  const [targetBlogPath, setTargetBlogPath] = useState("");

  const pathname = usePathname();
  const { operations, removeOperation, clearOperations } = useOperations();
  const { showToast } = useToast();

  useEffect(() => {
    const fetchPath = async () => {
      try {
        const configRes = await fetch(`/backend_config.json?t=${Date.now()}`);
        const config = await configRes.json();
        const res = await fetch(`http://127.0.0.1:${config.api_port}/api/deploy/config`);
        if (res.ok) {
          const data = await res.json();
          if (data.blogPath) {
            setTargetBlogPath(data.blogPath);
            localStorage.setItem('targetBlogPath', data.blogPath);
          }
        }
      } catch (e) {
        const path = localStorage.getItem('targetBlogPath') || "F:/Projects/my-blog";
        setTargetBlogPath(path);
      }
    };
    fetchPath();
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      if (currentScrollY > lastScrollY && currentScrollY > 80) setShowNav(false);
      else setShowNav(true);
      setLastScrollY(currentScrollY);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

  const navLinks = [
    { name: '首页', href: '/' },
    { name: '项目', href: '/projects' },
    { name: '归档', href: '/timeline' },
    { name: '照片墙', href: '/photowall' },
    { name: '音乐', href: '/music' },
    { name: '说说', href: '/moments' },
    { name: '杂谈', href: '/chatter' },
    { name: '📝 草稿箱', href: '/drafts' },
    { name: '友链', href: '/friends' },
    { name: '关于', href: '/about' },
    { name: '⚙️ 设置', href: '/settings' },
  ];

  const handleMinimize = () => {
    if (typeof window !== 'undefined' && (window as any).pywebview?.api) {
      (window as any).pywebview.api.minimize_window();
    }
  };
  const handleMaximize = () => {
    if (typeof window !== 'undefined' && (window as any).pywebview?.api) {
      (window as any).pywebview.api.maximize_window();
    }
  };
  const handleClose = () => {
    if (typeof window !== 'undefined' && (window as any).pywebview?.api) {
      (window as any).pywebview.api.close_window();
    }
  };

  // 🌟 监控增强版更新逻辑
  const handleUpdateLocal = async () => {
      if (operations.length === 0) {
        showToast("队列中没有待处理的操作", "warning");
        return;
      }

      try {
        showToast(`🔍 正在准备发送 ${operations.length} 个任务...`, "info");

        const configRes = await fetch(`/backend_config.json?t=${Date.now()}`);
        const configData = await configRes.json();
        const apiBase = `http://127.0.0.1:${configData.api_port}`;

        for (const op of operations) {
          let apiUrl = '';
          let body = {};

          switch (op.type) {
            case 'sync_photowall':
              apiUrl = `${apiBase}/api/gallery/sync`;
              body = { albums: op.value };
              break;
            case 'sync_friends':
              apiUrl = `${apiBase}/api/friends/sync`;
              body = { friends: op.value };
              break;
            case 'sync_projects':
              apiUrl = `${apiBase}/api/projects/sync`;
              body = { projects: op.value };
              break;
            case 'CONFIG':
              apiUrl = `${apiBase}/api/config/update`;
              body = { updates: op.payload };
              break;
            // 🌟 这是关键匹配逻辑
            case 'create_moment':
              apiUrl = `${apiBase}/api/moments/save`;
              body = op.payload;
              break;
            default:
              apiUrl = `${apiBase}/api/drafts/sync_local`;
              body = { operations: [op] };
              break;
          }

          showToast(`🚀 正在请求后端: ${apiUrl}`, "info");

          const res = await fetch(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
          });

          const data = await res.json();
          if (!data.success) {
            showToast(`❌ 任务执行失败: ${data.message}`, "error");
            return;
          }
        }

        showToast("✅ 任务已全部执行，本地数据已写入！", "success");
        clearOperations();
        setIsOpBoxOpen(false);

        setTimeout(() => {
          window.location.reload();
        }, 2000);

      } catch (error: any) {
        // 如果断网或报错，这里会强制提示
        showToast(`后端连接异常: ${error.message}`, "error");
      }
    };

  const handleSyncBlogClick = () => {
    if (!targetBlogPath) {
       const fallback = localStorage.getItem('targetBlogPath') || "F:/Projects/my-blog";
       setTargetBlogPath(fallback);
    }
    setIsOpBoxOpen(false);
    setSyncModalOpen(true);
  };

  const executeSyncBlog = async () => {
    setSyncModalOpen(false);

    try {
      const configRes = await fetch(`/backend_config.json?t=${Date.now()}`);
      const configData = await configRes.json();
      showToast("🚀 正在镜像数据至目标项目，请稍候...", "info");

      const res = await fetch(`http://127.0.0.1:${configData.api_port}/api/sync/execute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ blogPath: targetBlogPath })
      });

      const data = await res.json();
      if (data.success) {
        showToast(data.message, "success");
      } else {
        showToast(`❌ 同步失败: ${data.message}`, "error");
      }
    } catch (error) {
      showToast("无法连接到 Python 桌面核心引擎进行同步", "error");
    }
  };

  return (
    <>
      <header className={`w-full fixed top-0 left-0 right-0 z-[100] transition-all duration-500 border-b ${showNav ? 'translate-y-0' : '-translate-y-full'} bg-white/40 dark:bg-slate-900/50 backdrop-blur-xl border-white/20 dark:border-white/5 shadow-sm pywebview-drag-region`}>
        <div className="w-[95%] max-w-7xl mx-auto h-16 flex items-center justify-between px-4 box-border">

          <Link href="/" className="text-xl font-black text-slate-800 dark:text-white tracking-tighter">
            {siteConfig.navTitle}
            <span className="text-indigo-500 mx-1">
              {siteConfig.navSuffix || 'の'}
            </span>
            {siteConfig.navAfter}
          </Link>

          <div className="flex items-center gap-6">
            <nav className="hidden lg:flex gap-8 text-sm font-bold">
              {navLinks.map((link) => (
                <Link key={link.href} href={link.href} className={`relative py-1 transition-colors ${pathname === link.href ? 'text-indigo-600' : 'text-slate-700 dark:text-slate-200'}`}>
                  {link.name}
                </Link>
              ))}
            </nav>

            <div className="relative">
              <button onClick={() => setIsOpBoxOpen(!isOpBoxOpen)} className="relative w-10 h-10 rounded-xl bg-white/50 dark:bg-slate-800/50 flex items-center justify-center text-lg hover:scale-105 transition-all border border-white/20 shadow-sm cursor-pointer">
                📥
                {operations.length > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 flex h-5 w-5 items-center justify-center">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-5 w-5 bg-red-500 text-[10px] font-black text-white items-center justify-center border-2 border-white dark:border-slate-900">
                      {operations.length}
                    </span>
                  </span>
                )}
              </button>

              <AnimatePresence>
                {isOpBoxOpen && (
                  <motion.div initial={{ opacity: 0, y: 10, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 10, scale: 0.95 }} className="absolute right-0 mt-3 w-80 bg-white/90 dark:bg-slate-900/90 backdrop-blur-2xl border border-slate-200 dark:border-slate-700 rounded-2xl shadow-2xl p-4 z-50 cursor-default">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">待处理操作</h3>
                      <button onClick={clearOperations} className="text-[10px] text-red-500 font-bold hover:underline">清空全部</button>
                    </div>

                    <div className="flex flex-col gap-2 max-h-64 overflow-y-auto mb-4 custom-scrollbar">
                      {operations.length === 0 ? (
                        <p className="text-center py-6 text-sm text-slate-400 font-medium">暂无积攒的操作</p>
                      ) : (
                        operations.map(op => (
                          <div key={op.id} className="bg-white/50 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-100 dark:border-slate-700 flex justify-between items-center group">
                            <div className="flex flex-col">
                              <span className="text-[13px] font-bold text-slate-700 dark:text-slate-200">{op.label}</span>
                              <span className="text-[10px] text-slate-400">{op.timestamp}</span>
                            </div>
                            <button onClick={() => removeOperation(op.id)} className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-500 transition-all text-lg">✕</button>
                          </div>
                        ))
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <button onClick={handleSyncBlogClick} className="py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-black hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
                        🔄 同步 Blog
                      </button>
                      <button onClick={handleUpdateLocal} className="py-2.5 rounded-xl bg-indigo-500 text-white text-xs font-black shadow-lg shadow-indigo-500/30 hover:bg-indigo-600 transition-colors">
                        🚀 更新本地
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="flex items-center gap-2 ml-2 pl-6 border-l border-slate-300/50 dark:border-slate-600/50">
              <button onClick={handleMinimize} className="w-3.5 h-3.5 rounded-full bg-yellow-400 hover:bg-yellow-500 flex items-center justify-center group transition-colors shadow-sm cursor-pointer z-[101]">
                <span className="opacity-0 group-hover:opacity-100 text-[8px] text-yellow-900 font-black">-</span>
              </button>
              <button onClick={handleMaximize} className="w-3.5 h-3.5 rounded-full bg-green-400 hover:bg-green-500 flex items-center justify-center group transition-colors shadow-sm cursor-pointer z-[101]">
                <span className="opacity-0 group-hover:opacity-100 text-[8px] text-green-900 font-black">+</span>
              </button>
              <button onClick={handleClose} className="w-3.5 h-3.5 rounded-full bg-red-400 hover:bg-red-500 flex items-center justify-center group transition-colors shadow-sm cursor-pointer z-[101]">
                <span className="opacity-0 group-hover:opacity-100 text-[8px] text-red-900 font-black">×</span>
              </button>
            </div>

          </div>
        </div>
      </header>

      <AnimatePresence>
        {syncModalOpen && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSyncModalOpen(false)} className="absolute inset-0 bg-slate-900/40 backdrop-blur-md" />
            <motion.div initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="relative w-full max-w-sm bg-white/80 dark:bg-slate-900/80 backdrop-blur-2xl rounded-[40px] shadow-2xl border border-white/50 p-10 text-center">
              <div className="w-16 h-16 bg-amber-500/10 rounded-3xl flex items-center justify-center mx-auto mb-6">
                <AlertTriangle className="text-amber-500" size={32} />
              </div>
              <h3 className="text-xl font-black text-slate-900 dark:text-white mb-2">系统镜像覆盖</h3>
              <p className="text-sm text-slate-500 mb-8 leading-relaxed text-balance">
                确认将管理端数据覆盖至<br />
                <span className="font-bold text-amber-500 break-all">{targetBlogPath}</span> 吗？<br />
                <span className="text-xs opacity-80 text-red-400 font-bold mt-2 block">此操作将清空目标项目的旧文章与配置！</span>
              </p>
              <div className="flex gap-3">
                <button onClick={() => setSyncModalOpen(false)} className="flex-1 py-4 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-2xl text-xs font-black uppercase transition-colors hover:bg-slate-200 dark:hover:bg-slate-700">取消</button>
                <button onClick={executeSyncBlog} className="flex-1 py-4 bg-amber-500 hover:bg-amber-600 text-white rounded-2xl text-xs font-black uppercase shadow-lg shadow-amber-500/30 transition-all">确认覆盖</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}