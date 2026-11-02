"use client";

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import AICatSection from './AICatSection';
import {
  DEFAULT_PET_PERSONA,
  DEFAULT_PETS_CONFIG,
  PET_CATALOG,
  PetConfig,
  PetCorner,
  petVideoUrl,
} from '../pets/petCatalog';

const DEFAULT_BIG_FISH_ID = 'whale-1';
const MAX_PETS = 6;

const CORNERS: { value: PetCorner; label: string }[] = [
  { value: 'bottom-left', label: '左下角' },
  { value: 'bottom-right', label: '右下角' },
  { value: 'top-left', label: '左上角' },
  { value: 'top-right', label: '右上角' },
];

function Toggle({
  active,
  label,
  onClick,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center gap-1.5 rounded-xl px-2.5 py-1.5 text-[11px] font-black transition-colors ${
        active
          ? 'bg-indigo-500 text-white shadow-md shadow-indigo-500/20'
          : 'bg-slate-200/70 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
      }`}
    >
      <span
        className={`h-2 w-2 rounded-full ${active ? 'bg-white' : 'bg-slate-400 dark:bg-slate-600'}`}
      />
      {label}
    </button>
  );
}

export default function PetSection({ formData, handleUpdate, pushToQueue }: any) {
  const [showAddModal, setShowAddModal] = useState(false);
  const pets: PetConfig[] = Array.isArray(formData.petsConfig) ? formData.petsConfig : [];
  const geminiConfig = formData.geminiConfig || {
    modelId: 'gemini-2.5-flash-lite',
    systemPrompt: '',
    maxOutputTokens: 150,
    temperature: 0.85,
  };
  const cyberPersona =
    typeof geminiConfig.systemPrompt === 'string' ? geminiConfig.systemPrompt : '';

  const updatePets = (next: PetConfig[]) => handleUpdate('petsConfig', next);

  const updatePet = (id: string, patch: Partial<PetConfig>) => {
    updatePets(pets.map((pet) => (pet.id === id ? { ...pet, ...patch } : pet)));
  };

  const updateCyberPersona = (value: string) => {
    handleUpdate('geminiConfig', { ...geminiConfig, systemPrompt: value });
  };

  // 兜底：老配置里如果缺少默认大肥鱼，自动补一只；它和煤球都不允许删除。
  useEffect(() => {
    if (pets.some((pet) => pet.id === DEFAULT_BIG_FISH_ID)) return;
    updatePets([{ ...DEFAULT_PETS_CONFIG[0] }, ...pets]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pets]);

  /**
   * 添加宠物。
   *
   * TODO（自定义形象扩展点，当前不实现）：
   * 现在“添加宠物”固定创建 dsh-pet 的大肥鱼实例。后续可在这里扩展两种模式：
   * 1. 精灵图模式：保存 imageUrl、frameWidth/frameHeight、columns/rows 和动画帧表；
   * 2. 动画包模式：复用 dsh-pet 的 webm 目录结构与动画元数据。
   * 添加弹窗里的“自定义皮肤（敬请期待）”就是为这两类入口预留的位置。
   */
  const addBigFishPet = () => {
    if (pets.length >= MAX_PETS) return;

    const sameNameCount = pets.filter((pet) => (pet.name || '').startsWith('大肥鱼')).length;
    const name = sameNameCount === 0 ? '大肥鱼' : `大肥鱼 ${sameNameCount + 1}`;
    const corner: PetCorner = pets.length % 2 === 0 ? 'bottom-left' : 'bottom-right';

    updatePets([
      ...pets,
      {
        id: `pet-${Date.now().toString(36)}`,
        name,
        enabled: true,
        size: 200,
        corner,
        offsetX: 24,
        offsetY: 16,
        chatEnabled: true,
        whisperEnabled: false,
        whisperIntervalSec: 300,
        todoEnabled: true,
        persona: DEFAULT_PET_PERSONA,
      },
    ]);
    setShowAddModal(false);
  };

  const removePet = (id: string) => {
    if (id === DEFAULT_BIG_FISH_ID) return;
    if (!window.confirm('确定移除这只宠物吗？')) return;
    updatePets(pets.filter((pet) => pet.id !== id));
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.4, type: 'spring', stiffness: 100 }}
        className="rounded-[40px] border border-white/50 bg-white/40 p-8 shadow-xl backdrop-blur-xl dark:border-slate-800/50 dark:bg-slate-900/40"
      >
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4 border-b border-white/40 pb-6 dark:border-slate-700/50">
          <div>
            <h2 className="flex items-center gap-3 text-2xl font-black tracking-tight text-slate-800 dark:text-white">
              🐾 宠物管理
            </h2>
            <p className="mt-2 text-sm font-medium text-slate-500 dark:text-slate-400">
              煤球与大肥鱼沿用各自原有的形象渲染；这里统一管理性格提示词和所有宠物共用的 AI 参数。
            </p>
            <div className="mt-3 max-w-2xl space-y-1 text-xs leading-6 text-slate-500 dark:text-slate-400">
              <p>
                大肥鱼素材来自GitHub开源项目 dsh-pet （PC2005-cloud/dsh-pet），感谢原作者与共建者的分享。形象授权：CC BY-NC-SA
                4.0；此功能遵循相关许可，禁止商用，公开页面需保留署名。GitHub：{' '}
                <a
                  href="https://github.com/PC2005-cloud/dsh-pet"
                  target="_blank"
                  rel="noreferrer"
                  className="break-all text-indigo-500 underline hover:text-indigo-600"
                >
                  https://github.com/PC2005-cloud/dsh-pet
                </a>
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowAddModal(true)}
              disabled={pets.length >= MAX_PETS}
              className="rounded-2xl border border-indigo-500/30 bg-indigo-500/10 px-5 py-3 text-sm font-black text-indigo-600 transition-all hover:bg-indigo-500 hover:text-white disabled:cursor-not-allowed disabled:opacity-40 dark:text-indigo-300"
            >
              ＋ 添加宠物
            </button>
            <button
              type="button"
              onClick={() => pushToQueue('宠物管理')}
              className="flex items-center gap-2 rounded-2xl bg-indigo-500 px-6 py-3 text-sm font-black text-white shadow-lg shadow-indigo-500/30 transition-all hover:bg-indigo-600"
            >
              💾 暂存至队列
            </button>
          </div>
        </div>

        <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="rounded-3xl border border-white/50 bg-white/50 p-4 text-xs leading-6 text-slate-500 dark:border-slate-700/50 dark:bg-slate-800/40 dark:text-slate-400">
            <p className="mb-1 text-sm font-black text-slate-700 dark:text-slate-200">原有宠物不变</p>
            「煤球」仍由 CyberCat 渲染，大肥鱼由宠物层渲染，手机上可以长按大肥鱼触发其右键菜单；形象互不影响，性格提示词都在下方统一管理。
          </div>
          <div className="rounded-3xl border border-white/50 bg-white/50 p-4 text-xs leading-6 text-slate-500 dark:border-slate-700/50 dark:bg-slate-800/40 dark:text-slate-400">
            <p className="mb-1 text-sm font-black text-slate-700 dark:text-slate-200">如何生效</p>
            暂存到队列后点右上角「更新本地」，再「同步Blog」覆盖前台 siteConfig。
          </div>
          <div className="rounded-3xl border border-white/50 bg-white/50 p-4 text-xs leading-6 text-slate-500 dark:border-slate-700/50 dark:bg-slate-800/40 dark:text-slate-400">
            <p className="mb-1 text-sm font-black text-slate-700 dark:text-slate-200">运行提示</p>
            <p>Safari 不支持 VP9-Alpha 透明视频，建议使用 Chrome / Edge / Firefox。</p>
            <p className="mt-1">
              AI 对话 / 碎碎念复用现有{' '}
              <code className="rounded bg-slate-200/60 px-1 py-0.5 font-mono text-[11px] dark:bg-slate-700/60">
                /api/chat
              </code>{' '}
              接口，需要配置 GEMINI_API_KEY 或 OPENAI_API_KEY；待办数据只保存在浏览器本地。
            </p>
          </div>
        </div>

        <div className="mb-6">
          <AICatSection
            formData={formData}
            handleUpdate={handleUpdate}
            pushToQueue={pushToQueue}
            embedded
            showSave={false}
          />
        </div>

        <div className="mb-4">
          <h3 className="text-lg font-black tracking-tight text-slate-800 dark:text-white">宠物列表</h3>
          <p className="mt-1 text-[11px] font-medium text-slate-400">
            煤球与默认大肥鱼不可删除；之后添加的宠物可以移除。大肥鱼最多 {MAX_PETS} 只。
          </p>
        </div>

        <div className="space-y-6">
          {/* 煤球：原有 CyberCat，只开放性格提示词 */}
          <div className="grid grid-cols-1 gap-6 rounded-[32px] border border-white/50 bg-white/55 p-6 shadow-sm dark:border-slate-700/50 dark:bg-slate-800/40 lg:grid-cols-[160px_1fr]">
            <div className="flex flex-col items-center justify-center gap-3">
              <div className="flex h-28 w-full items-center justify-center overflow-hidden rounded-3xl border border-white/60 bg-gradient-to-br from-amber-100/60 to-orange-100/40 dark:border-slate-700/50 dark:from-slate-800 dark:to-slate-800/40">
                <div
                  className="h-24 w-24"
                  style={{
                    backgroundImage: "url('/siamese-cat.png')",
                    backgroundSize: '300% 300%',
                    backgroundPosition: '0% 0%',
                    imageRendering: 'pixelated',
                  }}
                />
              </div>
              <span className="rounded-full bg-amber-500/10 px-3 py-1 text-[10px] font-black text-amber-600 dark:bg-amber-500/15 dark:text-amber-300">
                原有宠物 · 不可删除
              </span>
              <span className="text-[10px] font-bold text-slate-400">CyberCat 渲染</span>
            </div>

            <div className="min-w-0 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-sm font-black text-slate-700 dark:text-slate-200">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-amber-500 text-[11px] text-white">
                    1
                  </span>
                  煤球
                </div>
                <Toggle
                  active={formData.cyberCatEnabled !== false}
                  label="启用"
                  onClick={() =>
                    handleUpdate('cyberCatEnabled', formData.cyberCatEnabled === false)
                  }
                />
              </div>

              <label className="block">
                <span className="mb-1.5 block text-[11px] font-black text-slate-500 dark:text-slate-400">
                  灵魂 Prompt（性格设定）
                </span>
                <textarea
                  value={cyberPersona}
                  onChange={(event) => updateCyberPersona(event.target.value)}
                  rows={4}
                  className="w-full resize-y rounded-2xl border border-slate-200 bg-white/80 px-4 py-3 text-xs font-medium leading-relaxed text-slate-700 outline-none focus:border-indigo-400 dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-100"
                  placeholder="例如：你是一只傲娇、聪明、有点毒舌但很可爱的暹罗猫…"
                />
              </label>

              <p className="text-[10px] leading-5 text-slate-400">
                煤球专属性格设置；形象与位置由 CyberCat 控制。其他宠物使用各自卡片中的性格提示词。
              </p>
            </div>
          </div>

          {pets.map((pet, index) => {
            const isProtected = pet.id === DEFAULT_BIG_FISH_ID;
            return (
              <div
                key={pet.id}
                className="grid grid-cols-1 gap-6 rounded-[32px] border border-white/50 bg-white/55 p-6 shadow-sm dark:border-slate-700/50 dark:bg-slate-800/40 lg:grid-cols-[160px_1fr]"
              >
                <div className="flex flex-col items-center justify-center gap-3">
                  <div className="flex h-28 w-full items-center justify-center overflow-hidden rounded-3xl border border-white/60 bg-gradient-to-br from-indigo-100/60 to-sky-100/40 dark:border-slate-700/50 dark:from-slate-800 dark:to-slate-800/40">
                    <video
                      src={petVideoUrl(PET_CATALOG.idle)}
                      autoPlay
                      loop
                      muted
                      playsInline
                      className="h-full w-full object-contain"
                    />
                  </div>
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-[10px] font-black text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                    {pet.enabled !== false ? '已启用' : '已停用'}
                  </span>
                  {isProtected ? (
                    <span className="rounded-full bg-indigo-500/10 px-3 py-1 text-[10px] font-black text-indigo-500 dark:bg-indigo-500/15 dark:text-indigo-300">
                      默认宠物 · 不可删除
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => removePet(pet.id)}
                      className="text-[10px] font-black text-slate-300 transition-colors hover:text-rose-500"
                    >
                      移除这只
                    </button>
                  )}
                </div>

                <div className="min-w-0 space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-2 text-sm font-black text-slate-700 dark:text-slate-200">
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-500 text-[11px] text-white">
                        {index + 2}
                      </span>
                      {pet.name}
                      {isProtected && (
                        <span className="rounded-full bg-indigo-500/10 px-2 py-0.5 text-[10px] font-black text-indigo-500 dark:bg-indigo-500/15 dark:text-indigo-300">
                          默认
                        </span>
                      )}
                    </div>
                    <Toggle
                      active={pet.enabled !== false}
                      label="启用"
                      onClick={() => updatePet(pet.id, { enabled: pet.enabled === false })}
                    />
                  </div>

                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <label className="block">
                      <span className="mb-1.5 block text-[11px] font-black text-slate-500 dark:text-slate-400">
                        名字
                      </span>
                      <input
                        value={pet.name}
                        onChange={(event) => updatePet(pet.id, { name: event.target.value })}
                        className="w-full rounded-2xl border border-slate-200 bg-white/80 px-4 py-2.5 text-sm font-bold text-slate-700 outline-none focus:border-indigo-400 dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-100"
                        placeholder="大肥鱼"
                      />
                    </label>

                    <label className="block">
                      <span className="mb-1.5 block text-[11px] font-black text-slate-500 dark:text-slate-400">
                        初始角落
                      </span>
                      <select
                        value={pet.corner ?? 'bottom-left'}
                        onChange={(event) =>
                          updatePet(pet.id, { corner: event.target.value as PetCorner })
                        }
                        className="w-full rounded-2xl border border-slate-200 bg-white/80 px-4 py-2.5 text-sm font-bold text-slate-700 outline-none focus:border-indigo-400 dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-100"
                      >
                        {CORNERS.map((corner) => (
                          <option key={corner.value} value={corner.value}>
                            {corner.label}
                          </option>
                        ))}
                      </select>
                    </label>
                  </div>

                  <div>
                    <div className="mb-1.5 flex items-center justify-between text-[11px] font-black text-slate-500 dark:text-slate-400">
                      <span>大小</span>
                      <span className="rounded-md bg-indigo-500/10 px-2 py-0.5 text-indigo-500">
                        {pet.size ?? 220}px
                      </span>
                    </div>
                    <input
                      type="range"
                      min={120}
                      max={360}
                      step={10}
                      value={pet.size ?? 220}
                      onChange={(event) => updatePet(pet.id, { size: Number(event.target.value) })}
                      className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-slate-200 accent-indigo-500 dark:bg-slate-700"
                    />
                  </div>

                  <div>
                    <span className="mb-2 block text-[11px] font-black text-slate-500 dark:text-slate-400">
                      功能开关
                    </span>
                    <div className="flex flex-wrap gap-2">
                      <Toggle
                        active={pet.chatEnabled !== false}
                        label="AI 聊天"
                        onClick={() => updatePet(pet.id, { chatEnabled: pet.chatEnabled === false })}
                      />
                      <Toggle
                        active={pet.todoEnabled !== false}
                        label="待办清单"
                        onClick={() => updatePet(pet.id, { todoEnabled: pet.todoEnabled === false })}
                      />
                      <Toggle
                        active={Boolean(pet.whisperEnabled)}
                        label="定期碎碎念"
                        onClick={() => updatePet(pet.id, { whisperEnabled: !pet.whisperEnabled })}
                      />
                    </div>
                  </div>

                  {pet.whisperEnabled && (
                    <label className="block max-w-xs">
                      <span className="mb-1.5 block text-[11px] font-black text-slate-500 dark:text-slate-400">
                        碎碎念间隔（秒，60–3600）
                      </span>
                      <input
                        type="number"
                        min={60}
                        max={3600}
                        step={30}
                        value={pet.whisperIntervalSec ?? 300}
                        onChange={(event) =>
                          updatePet(pet.id, {
                            whisperIntervalSec: Math.min(
                              3600,
                              Math.max(60, Number(event.target.value) || 300),
                            ),
                          })
                        }
                        className="w-full rounded-2xl border border-slate-200 bg-white/80 px-4 py-2.5 text-sm font-bold text-slate-700 outline-none focus:border-indigo-400 dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-100"
                      />
                    </label>
                  )}

                  <label className="block">
                    <span className="mb-1.5 block text-[11px] font-black text-slate-500 dark:text-slate-400">
                      性格提示词（人设）
                    </span>
                    <textarea
                      value={pet.persona ?? DEFAULT_PET_PERSONA}
                      onChange={(event) => updatePet(pet.id, { persona: event.target.value })}
                      rows={3}
                      className="w-full resize-y rounded-2xl border border-slate-200 bg-white/80 px-4 py-3 text-xs font-medium leading-relaxed text-slate-700 outline-none focus:border-indigo-400 dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-100"
                      placeholder="例如：你是主人博客上的小女仆，说话简短温柔…"
                    />
                  </label>

                  <p className="text-[10px] leading-5 text-slate-400">
                    提示：拖动宠物到任意位置后会自动记住；右键宠物可聊天、待办、睡觉或随机换动作。
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </motion.div>

      {showAddModal && (
        <div
          className="fixed inset-0 z-[10060] flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm"
          onClick={() => setShowAddModal(false)}
        >
          <div
            className="w-full max-w-2xl rounded-[32px] border border-white/60 bg-white/95 p-6 shadow-2xl dark:border-slate-700/60 dark:bg-slate-900/95"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <h3 className="text-xl font-black tracking-tight text-slate-800 dark:text-white">添加宠物</h3>
                <p className="mt-1 text-xs font-medium leading-6 text-slate-500 dark:text-slate-400">
                  目前只提供默认的大肥鱼形象；每只新宠物都会拥有独立的性格提示词。
                </p>
              </div>
              <button
                type="button"
                aria-label="关闭添加宠物弹窗"
                onClick={() => setShowAddModal(false)}
                className="rounded-xl px-2 py-1 text-lg font-black text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                ×
              </button>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="rounded-3xl border-2 border-indigo-400 bg-indigo-500/5 p-4">
                <div className="flex h-28 items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-100/60 to-sky-100/40 dark:from-slate-800 dark:to-slate-800/40">
                  <video
                    src={petVideoUrl(PET_CATALOG.idle)}
                    autoPlay
                    loop
                    muted
                    playsInline
                    className="h-full w-full object-contain"
                  />
                </div>
                <div className="mt-3 flex items-center justify-between gap-2">
                  <div>
                    <p className="text-sm font-black text-slate-800 dark:text-slate-100">大肥鱼</p>
                    <p className="mt-0.5 text-[11px] font-medium text-slate-400">
                      默认形象 · 使用精选动画
                    </p>
                  </div>
                  <span className="rounded-full bg-indigo-500 px-2.5 py-1 text-[10px] font-black text-white">
                    可添加
                  </span>
                </div>
              </div>

              <div className="rounded-3xl border-2 border-dashed border-slate-300 bg-slate-100/40 p-4 opacity-75 dark:border-slate-600 dark:bg-slate-800/30">
                <div className="flex h-28 items-center justify-center rounded-2xl border border-dashed border-slate-300 text-2xl font-black text-slate-300 dark:border-slate-600 dark:text-slate-600">
                  ?
                </div>
                <div className="mt-3 flex items-center justify-between gap-2">
                  <div>
                    <p className="text-sm font-black text-slate-500 dark:text-slate-300">自定义形象宠物</p>
                    <p className="mt-0.5 text-[11px] font-medium leading-5 text-slate-400">
                      敬请期待：以后可以上传精灵图并配置动画帧，或接入新的宠物动画包。
                    </p>
                  </div>
                  <span className="shrink-0 rounded-full bg-slate-200 px-2.5 py-1 text-[10px] font-black text-slate-500 dark:bg-slate-700 dark:text-slate-400">
                    规划中
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
              <p className="text-[11px] font-medium text-slate-400">
                大肥鱼最多 {MAX_PETS} 只（含默认）；煤球不占用这个名额。
              </p>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="rounded-2xl px-5 py-2.5 text-sm font-black text-slate-500 transition-colors hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
                >
                  取消
                </button>
                <button
                  type="button"
                  onClick={addBigFishPet}
                  disabled={pets.length >= MAX_PETS}
                  className="rounded-2xl bg-indigo-500 px-5 py-2.5 text-sm font-black text-white shadow-lg shadow-indigo-500/30 transition-all hover:bg-indigo-600 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  添加大肥鱼
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
