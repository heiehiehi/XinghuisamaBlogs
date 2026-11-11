'use client';

import { useEffect, useState } from 'react';

const options = [
  { id: 'coal', name: '煤球', description: '保留博客原有的煤球及其交互。' },
  { id: 'big-fish', name: '大肥鱼', description: '显示大肥鱼，点击播放回应动画。' },
] as const;
type Pet = typeof options[number]['id'];

export default function PetDisplaySection() {
  const [saved, setSaved] = useState<Pet | null>(null);
  const [selected, setSelected] = useState<Pet>('coal');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    const controller = new AbortController();
    fetch('/api/pet-selection', { signal: controller.signal, cache: 'no-store' })
      .then(async response => {
        const result = await response.json();
        if (!response.ok) throw new Error(result.detail);
        setSelected(result.activePet);
        setSaved(result.activePet);
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
        body: JSON.stringify({ activePet: selected }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.detail);
      setSaved(result.activePet);
      setMessage('已保存到本地博客。线上站点会在下次构建部署后更新。');
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : '未能保存宠物设置。');
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="rounded-3xl border border-white/50 bg-white/60 p-5 shadow-xl dark:border-slate-800 dark:bg-slate-900/70 md:p-7">
      <h2 className="text-xl font-bold">宠物展示</h2>
      <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">博客只显示选中的一只宠物。切换后随时可以选回另一只。</p>
      <fieldset disabled={saved === null || saving} className="mt-5 grid gap-3 sm:grid-cols-2">
        <legend className="sr-only">选择要展示的宠物</legend>
        {options.map(option => (
          <label key={option.id} className="flex cursor-pointer items-start gap-3 rounded-xl border border-slate-300 p-4 has-[:checked]:border-indigo-500 dark:border-slate-700">
            <input type="radio" name="activePet" value={option.id} checked={selected === option.id}
              onChange={() => { setSelected(option.id); setMessage(''); setError(''); }} className="mt-1 accent-indigo-600" />
            <span><strong className="block">{option.name}</strong><span className="text-sm">{option.description}</span></span>
          </label>
        ))}
      </fieldset>
      <button type="button" onClick={save} disabled={saved === null || selected === saved || saving}
        className="mt-5 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-bold text-white disabled:opacity-40">
        {saving ? '保存中…' : '保存到本地博客'}
      </button>
      {saved === null && !error && <p role="status" className="mt-3 text-sm">正在读取当前选择…</p>}
      {message && <p role="status" className="mt-3 text-sm">{message}</p>}
      {error && <p role="alert" className="mt-3 text-sm">{error}</p>}
    </section>
  );
}
