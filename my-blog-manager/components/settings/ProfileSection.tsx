"use client";

import { useState } from 'react';
import { motion } from 'framer-motion';
// 🌟 引入你的图床工具组件 (请根据你实际的文件夹层级调整相对路径，比如 ../editor/FloatingImageTool)
import FloatingImageTool from '../editor/FloatingImageTool';

export default function ProfileSection({ formData, handleUpdate, pushToQueue }: any) {
  // 🌟 终极防崩溃兜底
  const safeData = formData || {};
  const safeSocial = safeData.social || {};

  // 🌟 控制图床工具的状态
  const [isImageToolOpen, setIsImageToolOpen] = useState(false);
  const [targetImageField, setTargetImageField] = useState<'avatarUrl' | 'faviconUrl' | null>(null);

  // 打开图床工具，并记录是哪个输入框在请求图片
  const openImageTool = (field: 'avatarUrl' | 'faviconUrl') => {
    setTargetImageField(field);
    setIsImageToolOpen(true);
  };

  // 接收图床工具传回来的 URL，并更新对应的配置项
  const handleImageInsert = (url: string) => {
    if (targetImageField) {
      handleUpdate(targetImageField, url);
    }
    setIsImageToolOpen(false);
    setTargetImageField(null);
  };

  // 穿透更新嵌套的 social 对象
  const handleSocialUpdate = (platform: string, value: string) => {
    handleUpdate('social', {
      ...safeSocial,
      [platform]: value
    });
  };

  // 🌟🌟🌟 核心破局点：化繁为简！
  const handleSaveAll = () => {
    pushToQueue('全量更新个人名片');
  };

  return (
    <>
      <motion.section initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} className="bg-white/40 dark:bg-slate-900/40 backdrop-blur-2xl border border-white/50 dark:border-slate-800/50 rounded-[40px] p-8 shadow-2xl relative">
        <div className="flex flex-col md:flex-row gap-12 items-start">

          {/* 左侧：头像预览区域 */}
          <div className="relative group shrink-0 self-center md:self-start flex flex-col items-center gap-4">
            <motion.div whileHover={{ rotate: 0, scale: 1.05 }} className="w-40 h-40 rounded-[32px] p-1.5 bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 shadow-2xl rotate-6 transition-all duration-500">
              <img src={safeData.avatarUrl || ''} alt="Avatar" className="w-full h-full rounded-[26px] object-cover bg-white dark:bg-slate-900 border-2 border-white dark:border-slate-800" />
            </motion.div>
          </div>

          {/* 右侧：表单配置区域 */}
          <div className="flex-1 w-full space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

              {/* 🌟 导航栏三部曲配置区 */}
              <div className="col-span-1 md:col-span-2 bg-white/30 dark:bg-slate-800/30 p-5 rounded-3xl border border-slate-200/50 dark:border-slate-700/50 grid grid-cols-3 gap-4 shadow-sm">
                <div className="col-span-3 pb-2 border-b border-slate-200 dark:border-slate-700/50 mb-2">
                  <h3 className="text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    🧭 导航栏显示配置
                  </h3>
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase ml-1">前缀 (navTitle)</label>
                  <input type="text" value={safeData.navTitle || ''} onChange={e => handleUpdate('navTitle', e.target.value)} placeholder="例如: XingHuiSama" className="w-full bg-white/70 dark:bg-slate-900/70 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm mt-1 outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-bold" />
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase ml-1">连接符 (navSuffix)</label>
                  <input type="text" value={safeData.navSuffix || ''} onChange={e => handleUpdate('navSuffix', e.target.value)} placeholder="例如: の" className="w-full bg-white/70 dark:bg-slate-900/70 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm mt-1 outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-indigo-500 font-bold" />
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase ml-1">尾部 (navAfter)</label>
                  <input type="text" value={safeData.navAfter || ''} onChange={e => handleUpdate('navAfter', e.target.value)} placeholder="例如: 宝藏之地" className="w-full bg-white/70 dark:bg-slate-900/70 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm mt-1 outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-bold" />
                </div>
              </div>

              {/* 👇 🌟 新增：网站总标题 Title */}
              <div className="col-span-1 md:col-span-2">
                <label className="text-[10px] font-black text-slate-400 uppercase ml-1">网站总标题 (Browser Title)</label>
                <input type="text" value={safeData.title || ''} onChange={e => handleUpdate('title', e.target.value)} placeholder="例如: XingHuiSama の 宝藏之地" className="w-full bg-white/50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl px-4 py-3 text-sm mt-1 outline-none font-bold focus:ring-2 focus:ring-indigo-500" />
              </div>

              {/* 🌟 网页图标 Favicon */}
              <div className="col-span-1 md:col-span-2">
                <label className="text-[10px] font-black text-slate-400 uppercase ml-1 flex justify-between">
                  <span>网页标签小图标 (Favicon)</span>
                  {safeData.faviconUrl && <img src={safeData.faviconUrl} alt="favicon" className="w-4 h-4 rounded-full object-cover" />}
                </label>
                <div className="flex gap-2 mt-1">
                  <input type="text" value={safeData.faviconUrl || ''} onChange={e => handleUpdate('faviconUrl', e.target.value)} className="flex-1 bg-white/50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-indigo-500" />
                  <button onClick={() => openImageTool('faviconUrl')} className="px-4 bg-indigo-100 hover:bg-indigo-200 dark:bg-indigo-500/20 dark:hover:bg-indigo-500/40 text-indigo-600 dark:text-indigo-300 rounded-2xl font-black text-xs transition-colors whitespace-nowrap flex items-center gap-1 shadow-sm">
                    ☁️ 图床
                  </button>
                </div>
              </div>

              {/* 头像 URL */}
              <div className="col-span-1 md:col-span-2">
                <label className="text-[10px] font-black text-slate-400 uppercase ml-1">头像 URL (Avatar)</label>
                <div className="flex gap-2 mt-1">
                  <input type="text" value={safeData.avatarUrl || ''} onChange={e => handleUpdate('avatarUrl', e.target.value)} className="flex-1 bg-white/50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-indigo-500" />
                  <button onClick={() => openImageTool('avatarUrl')} className="px-4 bg-indigo-100 hover:bg-indigo-200 dark:bg-indigo-500/20 dark:hover:bg-indigo-500/40 text-indigo-600 dark:text-indigo-300 rounded-2xl font-black text-xs transition-colors whitespace-nowrap flex items-center gap-1 shadow-sm">
                    ☁️ 图床
                  </button>
                </div>
              </div>

              <div className="col-span-1 md:col-span-2">
                <label className="text-[10px] font-black text-slate-400 uppercase ml-1">作者名称</label>
                <input type="text" value={safeData.authorName || ''} onChange={e => handleUpdate('authorName', e.target.value)} className="w-full bg-white/50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl px-4 py-3 text-sm mt-1 outline-none font-bold focus:ring-2 focus:ring-indigo-500" />
              </div>
              <div className="col-span-1 md:col-span-2">
                <label className="text-[10px] font-black text-slate-400 uppercase ml-1">个人简介 (BIO)</label>
                <textarea rows={2} value={safeData.bio || ''} onChange={e => handleUpdate('bio', e.target.value)} className="w-full bg-white/50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl px-4 py-3 text-sm mt-1 outline-none resize-none focus:ring-2 focus:ring-indigo-500" />
              </div>

              {/* 社交媒体区域 */}
              <div className="col-span-1 md:col-span-2 pt-4 border-t border-slate-200 dark:border-slate-700/50 grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase ml-1">邮箱 Email</label>
                  <input type="text" value={safeSocial.email || ''} onChange={e => handleSocialUpdate('email', e.target.value)} className="w-full bg-white/50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl px-4 py-3 text-sm mt-1 outline-none" />
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Google 邮箱/链接</label>
                  <input type="text" value={safeSocial.google || ''} onChange={e => handleSocialUpdate('google', e.target.value)} className="w-full bg-white/50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl px-4 py-3 text-sm mt-1 outline-none" />
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase ml-1">微信 ID</label>
                  <input type="text" value={safeSocial.wechat || ''} onChange={e => handleSocialUpdate('wechat', e.target.value)} className="w-full bg-white/50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl px-4 py-3 text-sm mt-1 outline-none" />
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase ml-1">QQ 号码</label>
                  <input type="text" value={safeSocial.qq || ''} onChange={e => handleSocialUpdate('qq', e.target.value)} className="w-full bg-white/50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl px-4 py-3 text-sm mt-1 outline-none" />
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase ml-1">GitHub 地址</label>
                  <input type="text" value={safeSocial.github || ''} onChange={e => handleSocialUpdate('github', e.target.value)} className="w-full bg-white/50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl px-4 py-3 text-sm mt-1 outline-none" />
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Gitee 地址</label>
                  <input type="text" value={safeSocial.gitee || ''} onChange={e => handleSocialUpdate('gitee', e.target.value)} className="w-full bg-white/50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl px-4 py-3 text-sm mt-1 outline-none" />
                </div>
              </div>
            </div>

            <button onClick={handleSaveAll} className="px-10 py-3 bg-indigo-500 text-white rounded-2xl text-sm font-black shadow-xl hover:bg-indigo-600 transition-all active:scale-95 w-full md:w-auto">
              暂存修改至操作队列
            </button>
          </div>
        </div>
      </motion.section>

      {/* 🌟 挂载全局图床工具 */}
      <FloatingImageTool
        isOpen={isImageToolOpen}
        onClose={() => setIsImageToolOpen(false)}
        onInsert={handleImageInsert}
      />
    </>
  );
}