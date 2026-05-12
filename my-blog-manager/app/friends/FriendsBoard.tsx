"use client";

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import BackButton from '../../components/BackButton';
import { friendsData as initialFriends, Friend } from '../../data/friends';
import { Plus, Pencil, Trash2, AlertTriangle, Save, Edit3, X, CloudUpload, Sparkles } from 'lucide-react';
import { useOperations } from '../../context/OperationContext';
import { useToast } from '../../components/ToastProvider';
import FloatingImageTool from '../../components/editor/FloatingImageTool';

// 🌟 新增：引入配置和评论组件
import Comments from '../../components/Comments';
import { siteConfig } from '../../siteConfig';

const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.1 } }
};

const itemVariants = {
  hidden: { opacity: 0, y: 30, scale: 0.9 },
  show: { opacity: 1, y: 0, scale: 1, transition: { type: "spring", stiffness: 300, damping: 24 } }
};

export default function FriendsBoard() {
  const { addOperation } = useOperations();
  const { showToast } = useToast();

  const [editableFriends, setEditableFriends] = useState<Friend[]>(initialFriends);

  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; id: string | null; name: string | null }>({ isOpen: false, id: null, name: null });
  const [friendModal, setFriendModal] = useState<{ isOpen: boolean; mode: 'add' | 'edit'; data: Partial<Friend> }>({ isOpen: false, mode: 'add', data: {} });
  const [isImgToolOpen, setIsImgToolOpen] = useState(false);

  // 🌟 新增：控制复制按钮的状态和读取配置模板
  const [isCopied, setIsCopied] = useState(false);
  const applyFormat = siteConfig.friendLinkApplyFormat;

  const handleCopy = () => {
    navigator.clipboard.writeText(applyFormat);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const syncToQueue = (nextList: Friend[]) => {
    addOperation({
      id: `sync_friends_${Date.now()}`,
      type: "sync_friends",
      label: "同步友链数据变更",
      value: nextList
    });
    showToast("📍 变更已加入待处理队列，请在 Navbar 点击更新本地", "info");
  };

  const handleSaveFriend = () => {
    const { mode, data } = friendModal;
    if (!data.name || !data.url) { showToast("名称和 URL 不能为空哦", "warning"); return; }

    let next;
    if (mode === 'add') {
      const newFriend: Friend = {
        id: `friend_${Date.now()}`,
        name: data.name!,
        url: data.url!,
        avatar: data.avatar || 'https://bu.dusays.com/2026/03/24/69c1e38b4c370.jpg',
        description: data.description || '这位朋友很神秘，什么都没写。',
        themeColor: data.themeColor || '#6366f1'
      };
      next = [newFriend, ...editableFriends];
    } else {
      next = editableFriends.map(f => f.id === data.id ? { ...f, ...data } as Friend : f);
    }
    setEditableFriends(next);
    syncToQueue(next);
    setFriendModal({ isOpen: false, mode: 'add', data: {} });
  };

  const confirmDelete = () => {
    const next = editableFriends.filter(f => f.id !== deleteModal.id);
    setEditableFriends(next);
    syncToQueue(next);
    setDeleteModal({ isOpen: false, id: null, name: null });
  };

  return (
    <div className="w-full max-w-5xl mx-auto px-4 sm:px-10 py-10 relative z-10">

      <FloatingImageTool
        key={isImgToolOpen ? 'tool-open' : 'tool-closed'}
        isOpen={isImgToolOpen}
        onClose={() => setIsImgToolOpen(false)}
        onInsert={(url) => {
          setFriendModal(prev => ({ ...prev, data: { ...prev.data, avatar: url } }));
          setIsImgToolOpen(false);
        }}
      />

      <AnimatePresence>
        {deleteModal.isOpen && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-slate-900/40 backdrop-blur-md" />
            <motion.div initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="relative w-full max-w-sm bg-white/80 dark:bg-slate-900/80 backdrop-blur-2xl rounded-[40px] shadow-2xl border border-white/50 p-10 text-center">
              <div className="w-16 h-16 bg-red-500/10 rounded-3xl flex items-center justify-center mx-auto mb-6"><AlertTriangle className="text-red-500" /></div>
              <h3 className="text-xl font-black text-slate-900 dark:text-white mb-2">切断引力？</h3>
              <p className="text-sm text-slate-500 mb-8">确认从列表中移除 <span className="font-bold text-red-500">"{deleteModal.name}"</span> 吗？</p>
              <div className="flex gap-3">
                <button onClick={() => setDeleteModal({ ...deleteModal, isOpen: false })} className="flex-1 py-4 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-2xl text-xs font-black hover:bg-slate-200 transition-colors">取消</button>
                <button onClick={confirmDelete} className="flex-1 py-4 bg-red-500 text-white rounded-2xl text-xs font-black shadow-lg hover:bg-red-600 transition-colors">确认移除</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {friendModal.isOpen && (
          <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
            <motion.div initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 50, opacity: 0 }} className="relative w-full max-w-md bg-white/90 dark:bg-slate-900/90 backdrop-blur-2xl rounded-[40px] border border-white/20 p-8 shadow-2xl overflow-hidden">
               <h2 className="text-2xl font-black mb-6 dark:text-white flex items-center gap-2"><Sparkles className="text-indigo-500" /> {friendModal.mode === 'add' ? '建立新连接' : '修改朋友信息'}</h2>
               <div className="space-y-4">
                 <input type="text" value={friendModal.data.name || ''} onChange={e => setFriendModal({...friendModal, data: {...friendModal.data, name: e.target.value}})} className="w-full bg-slate-100 dark:bg-black/20 rounded-2xl px-5 py-3 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500 border-none" placeholder="朋友的名字" />
                 <input type="text" value={friendModal.data.url || ''} onChange={e => setFriendModal({...friendModal, data: {...friendModal.data, url: e.target.value}})} className="w-full bg-slate-100 dark:bg-black/20 rounded-2xl px-5 py-3 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500 border-none" placeholder="博客网址 (https://...)" />

                 <div className="relative group">
                    <input type="text" value={friendModal.data.avatar || ''} onChange={e => setFriendModal({...friendModal, data: {...friendModal.data, avatar: e.target.value}})} className="w-full bg-slate-100 dark:bg-black/20 rounded-2xl px-5 py-3 pr-14 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500 border-none" placeholder="头像 URL" />
                    <button onClick={() => setIsImgToolOpen(true)} className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center rounded-xl bg-indigo-500 text-white shadow-md hover:bg-indigo-600 transition-colors"><CloudUpload size={18} /></button>
                 </div>

                 <textarea value={friendModal.data.description || ''} onChange={e => setFriendModal({...friendModal, data: {...friendModal.data, description: e.target.value}})} className="w-full bg-slate-100 dark:bg-black/20 rounded-2xl px-5 py-3 dark:text-white h-20 outline-none focus:ring-2 focus:ring-indigo-500 border-none resize-none" placeholder="简单描述一下..." />

                 <div className="flex items-center gap-4 px-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">主题色：</label>
                    <input type="color" value={friendModal.data.themeColor || '#6366f1'} onChange={e => setFriendModal({...friendModal, data: {...friendModal.data, themeColor: e.target.value}})} className="w-10 h-10 rounded-lg overflow-hidden border-none cursor-pointer" />
                 </div>
               </div>
               <div className="mt-8 flex gap-3">
                 <button onClick={() => setFriendModal({ ...friendModal, isOpen: false })} className="flex-1 py-3 text-slate-500 font-bold hover:text-slate-800 dark:hover:text-white transition-colors">取消</button>
                 <button onClick={handleSaveFriend} className="flex-1 py-4 bg-indigo-500 text-white rounded-2xl font-black shadow-lg shadow-indigo-500/30 flex items-center justify-center gap-2 hover:bg-indigo-600 transition-colors"><Save size={18} /> 加入暂存</button>
               </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <div className="mb-12 flex flex-col items-center md:items-start">
        <div className="w-full flex justify-start mb-6">
          <BackButton />
        </div>
        <div className="text-center md:text-left w-full">
          <h1 className="text-4xl font-black text-slate-900 dark:text-white mb-4 tracking-widest drop-shadow-sm uppercase">云端引力</h1>
          <p className="text-slate-600 dark:text-slate-400 font-serif">那些散落在赛博宇宙各处的有趣灵魂与神经节点。</p>
        </div>
      </div>

      <motion.div variants={containerVariants} initial="hidden" animate="show" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

        <motion.div variants={itemVariants} onClick={() => setFriendModal({ isOpen: true, mode: 'add', data: {} })} className="group cursor-pointer flex flex-col items-center justify-center min-h-[200px] rounded-3xl border-4 border-dashed border-slate-300 dark:border-slate-700 bg-white/10 hover:border-indigo-500 hover:bg-indigo-500/5 transition-all duration-500">
            <div className="w-14 h-14 rounded-full bg-white dark:bg-slate-800 flex items-center justify-center text-slate-400 group-hover:bg-indigo-500 group-hover:text-white transition-all shadow-md group-hover:rotate-90">
              <Plus size={32} />
            </div>
            <span className="mt-4 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 group-hover:text-indigo-500">添加新朋友</span>
        </motion.div>

        {editableFriends.map((friend) => (
          <motion.div key={friend.id} variants={itemVariants} className="group relative">

            <div className="absolute top-4 right-4 z-30 flex gap-2 opacity-0 group-hover:opacity-100 transition-all -translate-y-2 group-hover:translate-y-0">
               <button onClick={() => setFriendModal({ isOpen: true, mode: 'edit', data: friend })} className="w-8 h-8 rounded-lg bg-indigo-500 text-white flex items-center justify-center shadow-lg hover:scale-110 transition-transform"><Edit3 size={14}/></button>
               <button onClick={() => setDeleteModal({ isOpen: true, id: friend.id, name: friend.name })} className="w-8 h-8 rounded-lg bg-red-500 text-white flex items-center justify-center shadow-lg hover:scale-110 transition-transform"><Trash2 size={14}/></button>
            </div>

            <a href={friend.url} target="_blank" rel="noopener noreferrer" className="block h-full rounded-3xl bg-white/60 dark:bg-slate-800/50 backdrop-blur-xl border border-white/40 dark:border-white/10 shadow-xl overflow-hidden transition-all duration-500 hover:-translate-y-2 hover:scale-[1.02] p-6 relative">
              <div className="absolute -bottom-10 -right-10 w-32 h-32 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-700" style={{ backgroundColor: friend.themeColor }}></div>

              <div className="flex items-center gap-5 relative z-10 mb-4">
                <div className="w-16 h-16 rounded-full p-1 bg-gradient-to-tr from-indigo-500/50 to-purple-500/50 shadow-md group-hover:rotate-[360deg] transition-transform duration-1000 ease-in-out flex-shrink-0">
                  <img src={friend.avatar} alt={friend.name} className="w-full h-full rounded-full object-cover bg-white" />
                </div>
                <div className="flex-1 overflow-hidden">
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors truncate">{friend.name}</h2>
                  <div className="text-xs font-bold text-indigo-500/70 dark:text-indigo-400/70 tracking-widest uppercase mt-1 flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse"></span> Online
                  </div>
                </div>
              </div>
              <p className="text-sm text-slate-700 dark:text-slate-300 font-serif leading-relaxed line-clamp-3 relative z-10">{friend.description}</p>
            </a>
          </motion.div>
        ))}
      </motion.div>

      {/* 🌟 新增：申请友链引导区 (与前端组件一致的移动端适配) */}
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

      {/* 🌟 新增：Gitalk 评论区 */}
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

        <Comments />
      </motion.div>

    </div>
  );
}