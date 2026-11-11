'use client';

import { useState, type FormEvent } from 'react';
import { requestPetReply } from '../lib/petChat';

export default function BigFishPet() {
  const [playing, setPlaying] = useState(false);
  const [unavailable, setUnavailable] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [reply, setReply] = useState('');
  const [sending, setSending] = useState(false);

  async function send(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const text = message.trim();
    if (!text || sending) return;
    setSending(true);
    setReply('');
    try {
      setReply(await requestPetReply(text));
      setMessage('');
    } catch {
      setReply('暂时没收到回复。请检查博客的 AI 设置，或稍后再试。');
    } finally {
      setSending(false);
    }
  }

  return (
    <div data-site-pet="big-fish" className="fixed bottom-4 right-4 z-40 flex flex-col items-end">
      {chatOpen && (
        <form id="big-fish-chat" onSubmit={send}
          className="mb-2 w-72 max-w-[calc(100vw-2rem)] rounded-2xl border border-slate-200 bg-white p-3 text-slate-800 shadow-xl dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100">
          <label htmlFor="big-fish-message" className="mb-2 block text-sm font-bold">和大肥鱼聊天</label>
          <div className="flex gap-2">
            <input id="big-fish-message" value={message} onChange={event => setMessage(event.target.value)}
              placeholder="说点什么…" maxLength={1000} disabled={sending} autoFocus
              className="min-w-0 flex-1 rounded-lg border border-slate-300 bg-transparent px-2 py-1.5 text-sm dark:border-slate-600" />
            <button type="submit" disabled={sending || !message.trim()}
              className="rounded-lg bg-indigo-600 px-3 text-sm font-bold text-white disabled:opacity-50">发送</button>
          </div>
          <p role="status" className="mt-2 max-h-36 overflow-auto whitespace-pre-wrap break-words text-sm">
            {sending ? '正在想…' : reply}
          </p>
        </form>
      )}
      <div className="relative">
        <button type="button" onClick={() => setChatOpen(open => !open)}
          aria-expanded={chatOpen} aria-controls={chatOpen ? 'big-fish-chat' : undefined}
          className="absolute left-0 top-0 z-10 rounded-xl border border-slate-200 bg-white/95 px-3 py-2 text-sm font-bold text-indigo-700 shadow dark:border-slate-700 dark:bg-slate-800 dark:text-indigo-200">
          {chatOpen ? '关闭聊天' : '聊天'}
        </button>
        <button type="button" aria-label="摸摸大肥鱼"
          onClick={() => setPlaying(true)}
          className="grid h-36 w-36 place-items-center rounded-2xl focus-visible:outline-2 focus-visible:outline-indigo-500 md:h-48 md:w-48">
          <span className="hidden rounded-xl bg-white/90 px-3 py-2 text-sm text-slate-800 motion-reduce:block">大肥鱼</span>
          {unavailable ? (
            <span className="rounded-xl bg-white/90 px-3 py-2 text-sm text-slate-800 motion-reduce:hidden">大肥鱼</span>
          ) : (
            <video key={playing ? 'happy' : 'idle'}
              className="pointer-events-none h-full w-full object-contain motion-reduce:hidden"
              src={playing ? '/pets/xhblogs-big-fish/happy.webm' : '/pets/xhblogs-big-fish/idle.webm'}
              autoPlay muted playsInline loop={!playing} aria-hidden="true"
              onEnded={() => setPlaying(false)}
              onError={() => playing ? setPlaying(false) : setUnavailable(true)} />
          )}
        </button>
      </div>
    </div>
  );
}
