"use client";

import { useState } from 'react';
import { motion } from 'framer-motion';
import BackButton from '../../components/BackButton';
import { friendsData } from '../../data/friends';
import Comments from '../../components/Comments'; // 🌟 引入你的 Gitalk 组件
import { siteConfig } from '../../siteConfig'; // 🌟 引入刚刚更新的全局配置文件

// Framer Motion 动画变体：交错子元素
const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.15 } // 每张卡片延迟 0.15 秒出现
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 30, scale: 0.9 },
  show: { opacity: 1, y: 0, scale: 1, transition: { type: "spring", stiffness: 300, damping: 24 } }
};

export default function FriendsBoard() {
  // 🌟 控制复制按钮的状态
  const [isCopied, setIsCopied] = useState(false);

  // 🌟 直接从 siteConfig 读取申请格式
  const applyFormat = siteConfig.friendLinkApplyFormat;

  const handleCopy = () => {
    navigator.clipboard.writeText(applyFormat);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  return (
    <div className="w-full max-w-5xl mx-auto px-3 sm:px-10 py-6 md:py-10 relative z-10 scroll-smooth mt-20 md:mt-10">

      {/* 顶部导航与标题 */}
      <div className="mb-8 md:mb-12 flex flex-col items-center md:items-start">
        <div className="w-full flex justify-start mb-4 md:mb-6">
          <BackButton />
        </div>
        <div className="text-center md:text-left w-full px-2 md:px-0">
          <h1 className="text-2xl md:text-4xl font-black text-slate-900 dark:text-white mb-2 md:mb-4 tracking-widest drop-shadow-sm uppercase">
            云端引力
          </h1>
          <p className="text-xs md:text-base text-slate-600 dark:text-slate-400 font-serif">
            那些散落在赛博宇宙各处的有趣灵魂与神经节点。
          </p>
        </div>
      </div>

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="grid grid-cols-2 lg:grid-cols-3 gap-3 md:gap-6"
      >
        {friendsData.map((friend) => (
          <motion.div key={friend.id} variants={itemVariants} className="h-full">
            <a
              href={friend.url}
              target="_blank"
              rel="noopener noreferrer"
              className="block h-full rounded-2xl md:rounded-3xl bg-white/60 dark:bg-slate-800/50 backdrop-blur-xl border border-white/40 dark:border-white/10 shadow-lg md:shadow-xl overflow-hidden transition-all duration-500 hover:-translate-y-1 md:hover:-translate-y-2 hover:scale-[1.02] group relative p-3 md:p-6"
            >
              {/* 卡片底部的动态光晕 */}
              <div
                className="absolute -bottom-10 -right-10 w-24 h-24 md:w-32 md:h-32 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-700"
                style={{ backgroundColor: friend.themeColor }}
              ></div>

              <div className="flex flex-col md:flex-row items-start md:items-center gap-2 md:gap-5 relative z-10 mb-2 md:mb-4">

                <div className="w-10 h-10 md:w-16 md:h-16 rounded-full p-[2px] md:p-1 bg-gradient-to-tr from-indigo-500/50 to-purple-500/50 shadow-sm md:shadow-md group-hover:rotate-[360deg] transition-transform duration-1000 ease-in-out flex-shrink-0">
                  <img src={friend.avatar} alt={friend.name} className="w-full h-full rounded-full object-cover bg-white" />
                </div>

                <div className="flex-1 overflow-hidden w-full">
                  <h2 className="text-sm md:text-xl font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors truncate">
                    {friend.name}
                  </h2>
                  <div className="text-[9px] md:text-xs font-bold text-indigo-500/70 dark:text-indigo-400/70 tracking-widest uppercase mt-0.5 md:mt-1 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 md:w-2 md:h-2 rounded-full bg-indigo-500 animate-pulse"></span>
                    Online
                  </div>
                </div>
              </div>

              <p className="text-[10px] md:text-sm text-slate-700 dark:text-slate-300 font-serif leading-snug md:leading-relaxed line-clamp-2 md:line-clamp-3 relative z-10">
                {friend.description}
              </p>
            </a>
          </motion.div>
        ))}
      </motion.div>

      {/* 申请友链引导区 */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6, delay: 0.2 }}
        className="mt-14 md:mt-20 bg-white/40 dark:bg-slate-800/40 backdrop-blur-xl border border-white/50 dark:border-slate-700/50 rounded-2xl md:rounded-3xl p-5 md:p-8 max-w-3xl mx-auto text-center shadow-lg md:shadow-xl relative"
      >
        <h2 className="text-lg md:text-2xl font-black text-slate-900 dark:text-white mb-2 md:mb-4 tracking-wider">
          ✨ 建立神经连接
        </h2>
        <p className="text-xs md:text-base text-slate-600 dark:text-slate-400 font-serif mb-4 md:mb-6">
          欢迎各位大佬交换友链！请一键复制下方格式，并在底部的 Gitalk 留言板申请：
        </p>

        {/* 代码展示框 & 一键复制按钮 */}
        <div className="relative bg-slate-100/60 dark:bg-slate-900/60 rounded-xl md:rounded-2xl p-4 md:p-5 text-left inline-block w-full max-w-md border border-slate-200/50 dark:border-slate-700/50 group overflow-hidden">
          <pre className="font-mono text-[10px] md:text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap break-all pr-8 md:pr-10">
            {applyFormat}
          </pre>

          <button
            onClick={handleCopy}
            className="absolute top-2 right-2 md:top-3 md:right-3 p-1.5 md:p-2 rounded-lg bg-white/80 dark:bg-slate-800/80 hover:bg-indigo-500 hover:text-white dark:hover:bg-indigo-500 transition-all duration-300 shadow-sm backdrop-blur-sm"
            title="一键复制"
          >
            {isCopied ? (
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3.5 h-3.5 md:w-4 md:h-4 text-green-500">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-3.5 h-3.5 md:w-4 md:h-4 text-slate-500 hover:text-white">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 01-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 011.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.876a9.06 9.06 0 00-1.5-.124H9.375c-.621 0-1.125.504-1.125 1.125v3.5m7.5 10.375H9.375a1.125 1.125 0 01-1.125-1.125v-9.25m12 6.625v-1.875a3.375 3.375 0 00-3.375-3.375h-1.5a1.125 1.125 0 01-1.125-1.125v-1.5a3.375 3.375 0 00-3.375-3.375H9.75" />
              </svg>
            )}
          </button>
        </div>

        <div className="mt-6 md:mt-8">
          <a
            href="#gitalk-container"
            className="inline-block px-6 py-2.5 md:px-8 md:py-3 bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white rounded-full text-sm md:text-base font-bold tracking-widest transition-all duration-300 hover:scale-105 active:scale-95 shadow-lg shadow-indigo-500/30"
          >
            前往留言区申请 👇
          </a>
        </div>
      </motion.div>

      {/* Gitalk 评论区 */}
      <motion.div
        id="gitalk-container"
        className="mt-12 md:mt-16 scroll-mt-24 px-2 md:px-0"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8 }}
      >
        <div className="flex items-center justify-center gap-2 md:gap-3 mb-4 md:mb-6">
          <span className="w-8 md:w-12 h-[1px] bg-slate-300 dark:bg-slate-700"></span>
          <h3 className="text-sm md:text-xl font-bold text-slate-800 dark:text-gray-200 tracking-widest uppercase">
            终端留言板
          </h3>
          <span className="w-8 md:w-12 h-[1px] bg-slate-300 dark:bg-slate-700"></span>
        </div>

        {/* 渲染评论组件 */}
        <Comments />
      </motion.div>

    </div>
  );
}