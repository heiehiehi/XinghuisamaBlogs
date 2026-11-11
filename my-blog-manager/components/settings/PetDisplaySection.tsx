'use client';

import { useEffect, useState } from 'react';

const options = [
  { id: 'coal', name: '煤球', description: '保留博客原有的煤球及其交互。' },
  { id: 'big-fish', name: '大肥鱼', description: '支持点击动画和聊天，沿用煤球的 AI 设置。' },
] as const;
type Pet = typeof options[number]['id'];
type Preferences = { activePet: Pet; todoEnabled: boolean; whisperEnabled: boolean; whisperMinutes: number };
const defaults: Preferences = { activePet: 'coal', todoEnabled: false, whisperEnabled: false, whisperMinutes: 5 };

export default function PetDisplaySection() {
  const [saved, setSaved] = useState<Preferences | null>(null);
  const [selection, setSelection] = useState(defaults);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    const controller = new AbortController();
    fetch('/api/pet-selection', { signal: controller.signal, cache: 'no-store' })
      .then(async response => {
        const result = await response.json();
        if (!response.ok) throw new Error(result.detail);
        setSelection(result);
        setSaved(result);
      })
      .catch(reason => {
        if (!controller.signal.aborted) setError(reason.message || '未能读取宠物设置。');
      });
    return () => controller.abort();
  }, []);

  async function save() {
    setSaving(true);
    setError('');
    setMessage('');
    try {
      const response = await fetch('/api/pet-selection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(selection),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.detail);
      setSaved(result);
      setSelection(result);
      setMessage('已保存到本地博客。线上站点会在下次构建部署后更新。');
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : '未能保存宠物设置。');
    } finally {
      setSaving(false);
    }
  }

  function change(update: Partial<Preferences>) {
    setSelection(previous => ({ ...previous, ...update }));
    setMessage('');
    setError('');
  }
  const changed = saved !== null && (Object.keys(defaults) as (keyof Preferences)[]).some(key => saved[key] !== selection[key]);

  return (
    <section className="rounded-3xl border border-white/50 bg-white/60 p-5 shadow-xl dark:border-slate-800 dark:bg-slate-900/70 md:p-7">
      <h2 className="text-xl font-bold">宠物展示</h2>
      <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">博客只显示选中的一只宠物。切换后随时可以选回另一只。</p>
      <fieldset disabled={saved === null || saving} className="mt-5 grid gap-3 sm:grid-cols-2">
        <legend className="sr-only">选择要展示的宠物</legend>
        {options.map(option => (
          <label key={option.id} className="flex cursor-pointer items-start gap-3 rounded-xl border border-slate-300 p-4 has-[:checked]:border-indigo-500 dark:border-slate-700">
            <input type="radio" name="activePet" value={option.id} checked={selection.activePet === option.id}
              onChange={() => change({ activePet: option.id })} className="mt-1 accent-indigo-600" />
            <span><strong className="block">{option.name}</strong><span className="text-sm">{option.description}</span></span>
          </label>
        ))}
      </fieldset>
      {selection.activePet === 'big-fish' && (
        <fieldset disabled={saved === null || saving} className="mt-5 grid gap-3 rounded-xl border border-slate-300 p-4 text-sm dark:border-slate-700">
          <legend className="px-2 font-bold">大肥鱼功能</legend>
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={selection.todoEnabled} onChange={event => change({ todoEnabled: event.target.checked })} className="accent-indigo-600" />
            本地待办
          </label>
          <p className="text-xs text-slate-600 dark:text-slate-300">待办保存在访客自己的浏览器里。</p>
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={selection.whisperEnabled} onChange={event => change({ whisperEnabled: event.target.checked })} className="accent-indigo-600" />
            定时碎碎念
          </label>
          <p className="text-xs text-slate-600 dark:text-slate-300">默认关闭。开启后会偶尔显示一句本地台词，不调用 AI。</p>
          {selection.whisperEnabled && (
            <label className="flex items-center gap-2">
              间隔
              <select value={selection.whisperMinutes} onChange={event => change({ whisperMinutes: Number(event.target.value) })}
                className="rounded-lg border border-slate-300 bg-white px-2 py-1 dark:border-slate-700 dark:bg-slate-800">
                {[1, 5, 10].map(minutes => <option key={minutes} value={minutes}>{minutes} 分钟</option>)}
              </select>
            </label>
          )}
        </fieldset>
      )}
      <button type="button" onClick={save} disabled={!changed || saving}
        className="mt-5 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-bold text-white disabled:opacity-40">
        {saving ? '保存中…' : '保存到本地博客'}
      </button>
      {saved === null && !error && <p role="status" className="mt-3 text-sm">正在读取当前选择…</p>}
      {message && <p role="status" className="mt-3 text-sm">{message}</p>}
      {error && <p role="alert" className="mt-3 text-sm">{error}</p>}
    </section>
  );
}
