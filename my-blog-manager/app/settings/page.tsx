"use client";

import { useState, useEffect } from 'react';
import BriefingSection from '../../components/settings/BriefingSection';
import { motion, AnimatePresence } from 'framer-motion';
import { useOperations } from '../../context/OperationContext';
import { siteConfig } from '../../siteConfig';
import Navbar from '../../components/Navbar';
import PageTransition from '../../components/PageTransition';
import { ToastProvider, useToast } from '../../components/ToastProvider';

import ProfileSection from '../../components/settings/ProfileSection';
import BackgroundSection from '../../components/settings/BackgroundSection';
import MusicSection from '../../components/settings/MusicSection';
import GallerySection from '../../components/settings/GallerySection';
import RepoSection from '../../components/settings/RepoSection';
import DisplaySection from '../../components/settings/DisplaySection';
import CommentSection from '../../components/settings/CommentSection';
import DanmakuSection from '../../components/settings/DanmakuSection';
import FooterSection from '../../components/settings/FooterSection';
import PetSection from '../../components/settings/PetSection';

function SettingsContent() {
  const { operations, addOperation } = useOperations();
  const [activeTab, setActiveTab] = useState('profile');
  const [briefingVisited, setBriefingVisited] = useState(false);
  const [backendMode, setBackendMode] = useState<'checking' | 'preview' | 'live' | 'offline'>('checking');
  const { showToast } = useToast();
  useEffect(() => {
    const readTab = () => {
      const tab = new URLSearchParams(window.location.search).get('tab');
      if (tab && ['profile', 'display', 'background', 'music', 'gallery', 'footer', 'danmaku', 'comment', 'pets', 'repo', 'briefing'].includes(tab)) {
        setActiveTab(tab);
        if (tab === 'briefing') setBriefingVisited(true);
      }
    };
    readTab();
    window.addEventListener('popstate', readTab);
    return () => window.removeEventListener('popstate', readTab);
  }, []);
  function selectTab(tab: string) {
    setActiveTab(tab);
    if (tab === 'briefing') setBriefingVisited(true);
    const url = new URL(window.location.href);
    url.searchParams.set('tab', tab);
    window.history.replaceState(null, '', url);
  }

  const [formData, setFormData] = useState<any>({
    authorName: siteConfig.authorName || "",
    bio: siteConfig.bio || "",
    avatarUrl: siteConfig.avatarUrl || "",
    social: siteConfig.social || {},
    cloudMusicIds: [...(siteConfig.cloudMusicIds || [])],
    bgImages: [...(siteConfig.bgImages || [])],
    // 👇 🌟 壁纸分组系统初始化
    bgGroups: ((siteConfig as any).bgGroups || []).map((g: any) => ({ ...g, images: [...(g.images || [])] })),
    activeBgGroup: (siteConfig as any).activeBgGroup || 'default',
    gitalkConfig: siteConfig.gitalkConfig || {
      clientID: '',
      clientSecret: '',
      repo: '',
      owner: '',
      admin: []
    },
    newMusicId: '',
    danmakuList: [...(siteConfig.danmakuList || [])],
    buildDate: siteConfig.buildDate || "2026-03-23T00:00:00",
    icpConfig: siteConfig.icpConfig || { name: "", link: "" },
    footerBadges: [...(siteConfig.footerBadges || [])],
    // 👇 🌟 初始化小猫 AI 配置数据
    geminiConfig: siteConfig.geminiConfig || {
      modelId: 'gemini-2.5-flash-lite',
      systemPrompt: '',
      maxOutputTokens: 150,
      temperature: 0.85
    },
    // 🐾 独立宠物层
    petsConfig: Array.isArray((siteConfig as any).petsConfig)
      ? (siteConfig as any).petsConfig.map((pet: any) => ({ ...pet }))
      : [],
    // 🐈 原有煤球开关
    cyberCatEnabled: siteConfig.cyberCatEnabled !== false
  });

  const [queryLoading, setQueryLoading] = useState(false);
  const [queryResult, setQueryResult] = useState<any>(null);
  const [musicDetails, setMusicDetails] = useState<Record<string, any>>({});

  useEffect(() => {
    const controller = new AbortController();
    const fetchRealConfig = async () => {
      try {
        const configRes = await fetch(`/backend_config.json?t=${Date.now()}`, { signal: controller.signal });
        if (!configRes.ok) throw new Error('无法读取本机连接设置');
        const configData = await configRes.json();
        if (configData.previewOnly === true) {
          setBackendMode('preview');
          return;
        }

        const res = await fetch(`http://127.0.0.1:${configData.api_port}/api/config/get`, { cache: 'no-store', signal: controller.signal });
        if (!res.ok) throw new Error('网站设置服务尚未就绪');
        const data = await res.json();

        if (data.success && data.data) {
          setFormData((prev: any) => ({
            ...prev,
            ...data.data,
            social: { ...(prev.social || {}), ...(data.data.social || {}) },
            gitalkConfig: { ...(prev.gitalkConfig || {}), ...(data.data.gitalkConfig || {}) },
            // 👇 🌟 合并后端发来的壁纸分组数据
            bgGroups: data.data.bgGroups?.length ? data.data.bgGroups : prev.bgGroups,
            activeBgGroup: data.data.activeBgGroup || prev.activeBgGroup,
            danmakuList: data.data.danmakuList ? [...data.data.danmakuList] : prev.danmakuList,
            buildDate: data.data.buildDate || prev.buildDate,
            icpConfig: data.data.icpConfig || prev.icpConfig,
            footerBadges: data.data.footerBadges ? [...data.data.footerBadges] : prev.footerBadges,
            // 👇 🌟 合并后端发来的小猫配置
            geminiConfig: { ...(prev.geminiConfig || {}), ...(data.data.geminiConfig || {}) },
            // 🐾 宠物列表用数组整体替换，允许用户删到空列表
            petsConfig: Array.isArray(data.data.petsConfig) ? data.data.petsConfig : prev.petsConfig,
            // 🐈 煤球开关
            cyberCatEnabled:
              typeof data.data.cyberCatEnabled === 'boolean'
                ? data.data.cyberCatEnabled
                : prev.cyberCatEnabled
          }));
          setBackendMode('live');
        } else {
          setBackendMode('offline');
        }
      } catch (error) {
        if (!controller.signal.aborted) setBackendMode('offline');
      }
    };

    fetchRealConfig();
    return () => controller.abort();
  }, []);

  const handleUpdate = (field: string, value: any) => {
    setFormData((prev: any) => ({ ...prev, [field]: value }));
  };

  const fetchMusicDetail = async (id: string) => {
    try {
      const configRes = await fetch(`/backend_config.json?t=${Date.now()}`);
      const configData = await configRes.json();
      const res = await fetch(`http://127.0.0.1:${configData.api_port}/api/music/query/${id}`, { cache: 'no-store' });
      const data = await res.json();
      return data.success ? data.data : { error: true, id, name: "查询失败或无版权" };
    } catch (error) {
      return { error: true, id, name: "后端通信通道断开" };
    }
  };

  useEffect(() => {
    if (backendMode !== 'live') return;
    const loadInitialMusicDetails = async () => {
      const details: Record<string, any> = { ...musicDetails };
      let hasUpdate = false;
      for (const id of formData.cloudMusicIds || []) {
        if (!details[id]) {
          const info = await fetchMusicDetail(id);
          if (info) {
            details[id] = info;
            hasUpdate = true;
          }
        }
      }
      if (hasUpdate) setMusicDetails(details);
    };
    if (formData.cloudMusicIds?.length > 0) {
      loadInitialMusicDetails();
    }
  }, [formData.cloudMusicIds, backendMode]);

  const queryMusic = async () => {
    if (!formData.newMusicId) {
      showToast("ID不能为空哦", "warning");
      return;
    }
    setQueryLoading(true);
    setQueryResult(null);

    const info = await fetchMusicDetail(formData.newMusicId);
    if (info && !info.error) {
      setQueryResult(info);
      showToast("获取成功！", "success");
    } else {
      showToast(info?.name || "未找到该歌曲", "error");
    }
    setQueryLoading(false);
  };

  const removeSong = (index: number) => {
    const newList = [...formData.cloudMusicIds];
    newList.splice(index, 1);
    handleUpdate('cloudMusicIds', newList);
    showToast("已移除一首歌曲", "success");
  };

  const confirmAddMusic = () => {
    if (!queryResult) return;
    const targetId = String(queryResult.id);
    const exists = formData.cloudMusicIds.some((id: string | number) => String(id) === targetId);

    if (exists) {
      showToast(`⚠️ 《${queryResult.name}》已经在列表里啦，不要重复添加！`, "warning");
    } else {
      handleUpdate('cloudMusicIds', [...formData.cloudMusicIds, targetId]);
      setMusicDetails(prev => ({ ...prev, [targetId]: queryResult }));
      setQueryResult(null);
      handleUpdate('newMusicId', '');
      showToast("✅ 成功存入播放列表！", "success");
    }
  };

  const pushToQueue = (label: string, key?: string, value?: any) => {
    addOperation({
      id: Date.now().toString(),
      type: 'CONFIG',
      label: `配置暂存：${label}`,
      description: `修改了系统的 ${label}，等待同步至 my-blog`,
      timestamp: new Date().toLocaleTimeString().slice(0, 5),
      payload: formData,
      key: key,
      value: value
    });
    showToast(`🎉 【${label}】已加入右上角操作队列！`, "success");
  };

  // 👇 🌟 在菜单里增加 AI 猫咪入口
  const menuItems = [
    { id: 'profile', name: '个人名片设置', icon: '👤' },
    { id: 'briefing', name: '每日选刊', icon: '📖' },
    { id: 'display', name: '视窗画面设置', icon: '🪟' },
    { id: 'background', name: '视觉背景配置', icon: '🌌' },
    { id: 'music', name: '音乐播放设置', icon: '🎵' },
    { id: 'gallery', name: '图库配置管理', icon: '🖼️' },
    { id: 'footer', name: '首页底部设置', icon: '🧩' },
    { id: 'danmaku', name: '全站弹幕设置', icon: '⚡' },
    { id: 'comment', name: '评论系统配置', icon: '💬' },
    { id: 'pets', name: '宠物管理', icon: '🐋' },
    { id: 'repo', name: '项目仓库设置', icon: '🚀' },
  ];


  return (
    <div className="min-h-screen relative pb-10">
      <Navbar compact previewOnly={backendMode !== 'live'} />

      <PageTransition>
        <main className="w-[95%] max-w-7xl mx-auto mt-24 flex flex-col md:flex-row gap-8 items-start relative z-10">

          <div className="w-full md:w-60 shrink-0 flex flex-col gap-4">
            <div className="bg-white/40 dark:bg-slate-900/40 backdrop-blur-xl border border-white/50 dark:border-slate-800/50 rounded-3xl p-4 shadow-xl">
              <h1 className="mb-4 ml-2 text-base font-bold text-slate-700 dark:text-slate-200">网站控制台</h1>
              <nav aria-label="网站控制台设置" className="flex gap-2 overflow-x-auto md:flex-col md:overflow-visible">

                {menuItems.map((item) => (
                  <button key={item.id} aria-current={activeTab === item.id ? 'page' : undefined} onClick={() => selectTab(item.id)} className={`flex shrink-0 items-center gap-3 px-4 py-3 rounded-2xl transition-all duration-300 font-bold text-sm ${activeTab === item.id ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/30 translate-x-1' : 'text-slate-600 dark:text-slate-300 hover:bg-white/50 dark:hover:bg-slate-800/50'}`}>
                    <span>{item.icon}</span>{item.name}
                  </button>
                ))}
              </nav>
            </div>
            {backendMode === 'live' && <div className="bg-amber-500/10 border border-amber-500/30 rounded-3xl p-4 mt-4">
              <p className="text-xs font-black text-amber-600 dark:text-amber-400 mb-2">🔄 数据中枢操作</p>
              <button className="w-full py-2 bg-amber-500/20 text-amber-700 dark:text-amber-300 rounded-xl text-xs font-bold hover:bg-amber-500 hover:text-white transition-all text-left px-4 flex justify-between">
                <span>拉取 my-blog 数据</span><span>📥</span>
              </button>
            </div>}
          </div>

          <div className="min-w-0 flex-1 w-full">
            {backendMode !== 'live' && <div role="status" className="mb-6 rounded-2xl border border-amber-200/60 bg-amber-50/80 px-5 py-4 text-xs leading-7 text-amber-800 dark:border-amber-400/20 dark:bg-amber-950/40 dark:text-amber-200">{backendMode === 'checking' ? '正在检查本机连接…' : backendMode === 'preview' ? '当前是统一控制台的本地预览：每日选刊可以保存；其他原有栏目可只读查看。网站同步、发布和现有每日任务保持原样。' : '网站通用设置后台尚未连接，暂时只读。每日选刊使用自己的本机连接，可在该栏目检查状态。'}{backendMode === 'offline' && <button className="ml-3 underline" onClick={() => window.location.reload()}>重新检测</button>}</div>}
            {briefingVisited && <div hidden={activeTab !== 'briefing'}><BriefingSection /></div>}
            <fieldset disabled={backendMode !== 'live'} hidden={activeTab === 'briefing'} className="min-w-0 w-full border-0 p-0">
            <AnimatePresence mode="wait">
              {activeTab === 'profile' && <ProfileSection key="profile" formData={formData} handleUpdate={handleUpdate} pushToQueue={pushToQueue} />}
              {activeTab === 'display' && <DisplaySection key="display" showToast={showToast} />}
              {activeTab === 'background' && <BackgroundSection key="background" formData={formData} handleUpdate={handleUpdate} pushToQueue={pushToQueue} />}
              {activeTab === 'music' && <MusicSection key="music" formData={formData} handleUpdate={handleUpdate} pushToQueue={pushToQueue} musicDetails={musicDetails} queryMusic={queryMusic} queryLoading={queryLoading} queryResult={queryResult} confirmAddMusic={confirmAddMusic} removeSong={removeSong} />}
              {activeTab === 'gallery' && <GallerySection key="gallery" formData={formData} handleUpdate={handleUpdate} pushToQueue={pushToQueue} />}
              {activeTab === 'footer' && <FooterSection key="footer" formData={formData} handleUpdate={handleUpdate} pushToQueue={pushToQueue} />}
              {activeTab === 'danmaku' && <DanmakuSection key="danmaku" formData={formData} handleUpdate={handleUpdate} pushToQueue={pushToQueue} />}
              {activeTab === 'comment' && <CommentSection key="comment" formData={formData} handleUpdate={handleUpdate} pushToQueue={pushToQueue} />}
              {/* 🐾 宠物管理（含共用 AI 性格调度中心） */}
              {activeTab === 'pets' && <PetSection key="pets" formData={formData} handleUpdate={handleUpdate} pushToQueue={pushToQueue} />}

              {activeTab === 'repo' && backendMode === 'live' && <RepoSection key="repo" />}
            </AnimatePresence>
            </fieldset>
            {activeTab === 'repo' && backendMode !== 'live' && <section className="rounded-3xl border border-white/60 bg-white/60 p-8 text-sm leading-8 text-slate-600 backdrop-blur-xl dark:border-white/10 dark:bg-slate-900/60 dark:text-slate-300"><h2 className="mb-3 text-lg font-semibold">项目仓库设置</h2>原有仓库配置和发布功能已保留。此副本尚未连接网站通用后台，接通后可以在这里管理；当前不会读取密钥或执行发布。</section>}
          </div>

        </main>
      </PageTransition>
    </div>
  );
}

export default function SettingsPage() {
  return (
    <ToastProvider>
      <SettingsContent />
    </ToastProvider>
  );
}
