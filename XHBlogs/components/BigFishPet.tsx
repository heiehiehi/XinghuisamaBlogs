'use client';

import { useEffect, useRef, useState, type FormEvent, type PointerEvent } from 'react';
import { requestPetReply } from '../lib/petChat';

type Position = { x: number; y: number };
type Todo = { id: string; text: string; done: boolean };
type Preferences = { todoEnabled?: boolean; whisperEnabled?: boolean; whisperMinutes?: number; bigFishSize?: string };
const fishSizes = {
  regular: 'h-44 w-44 md:h-60 md:w-60',
  large: 'h-56 w-56 md:h-80 md:w-80',
  'extra-large': 'h-64 w-64 md:h-96 md:w-96',
};
const initialPosition = { x: 1, y: 1 };
const positionKey = 'xhblogs:big-fish:position';
const todosKey = 'xhblogs:big-fish:todos';
const whispers = ['累了就歇一会儿吧。', '咕噜咕噜，记得喝水！', '慢慢来，今天也有进展。', '我就在这里陪你。'];
const clamp = (value: number) => Math.min(1, Math.max(0, value));
const buttonStyle = 'rounded-xl border border-slate-200 bg-white/95 px-3 py-2 text-sm font-bold text-indigo-700 shadow dark:border-slate-700 dark:bg-slate-800 dark:text-indigo-200';
const panelStyle = 'absolute w-72 max-w-[calc(100vw-2rem)] rounded-2xl border border-slate-200 bg-white p-3 text-slate-800 shadow-xl dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100';
const inputStyle = 'min-w-0 flex-1 rounded-lg border border-slate-300 bg-transparent px-2 py-1.5 text-sm dark:border-slate-600';
const submitStyle = 'rounded-lg bg-indigo-600 px-3 text-sm font-bold text-white disabled:opacity-50';

function readLocal(key: string): unknown {
  try { return JSON.parse(localStorage.getItem(key) ?? 'null'); } catch { return null; }
}
function saveLocal(key: string, value: unknown) {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* Keep the current session usable. */ }
}

export default function BigFishPet({ preferences }: { preferences: Preferences }) {
  const [playing, setPlaying] = useState(false);
  const [unavailable, setUnavailable] = useState(false);
  const [panel, setPanel] = useState<'chat' | 'todo' | null>(null);
  const [message, setMessage] = useState('');
  const [reply, setReply] = useState('');
  const [sending, setSending] = useState(false);
  const [position, setPosition] = useState(initialPosition);
  const [dragging, setDragging] = useState(false);
  const [todos, setTodos] = useState<Todo[]>([]);
  const [todoText, setTodoText] = useState('');
  const [whisper, setWhisper] = useState('');
  const region = useRef<HTMLDivElement>(null);
  const pet = useRef<HTMLDivElement>(null);
  const positionRef = useRef(initialPosition);
  const drag = useRef<{ id: number; x: number; y: number; offsetX: number; offsetY: number } | null>(null);
  const moved = useRef(false);
  const lineIndex = useRef(0);

  useEffect(() => {
    const saved = readLocal(positionKey) as Position | null;
    if (typeof saved?.x === 'number' && typeof saved.y === 'number' && Number.isFinite(saved.x) && Number.isFinite(saved.y)) {
      positionRef.current = { x: clamp(saved.x), y: clamp(saved.y) };
      setPosition(positionRef.current);
    }
    const list = readLocal(todosKey);
    if (Array.isArray(list)) setTodos(list.filter(item => typeof item?.id === 'string' && typeof item.text === 'string' && typeof item.done === 'boolean'));
  }, []);

  useEffect(() => {
    if (!preferences.whisperEnabled || panel || dragging) return;
    let dismiss: ReturnType<typeof setTimeout> | undefined;
    const minutes = [1, 5, 10].includes(preferences.whisperMinutes ?? 0) ? preferences.whisperMinutes! : 5;
    const timer = setInterval(() => {
      if (document.hidden) return;
      setWhisper(whispers[lineIndex.current++ % whispers.length]);
      clearTimeout(dismiss);
      dismiss = setTimeout(() => setWhisper(''), 6500);
    }, minutes * 60_000);
    return () => {
      clearInterval(timer);
      clearTimeout(dismiss);
    };
  }, [preferences.whisperEnabled, preferences.whisperMinutes, panel, dragging]);

  function startDrag(event: PointerEvent<HTMLButtonElement>) {
    if (!event.isPrimary || event.button !== 0 || !pet.current) return;
    const rect = pet.current.getBoundingClientRect();
    moved.current = false;
    drag.current = { id: event.pointerId, x: event.clientX, y: event.clientY, offsetX: event.clientX - rect.left, offsetY: event.clientY - rect.top };
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function moveDrag(event: PointerEvent<HTMLButtonElement>) {
    const start = drag.current;
    if (!start || start.id !== event.pointerId || !region.current || !pet.current) return;
    if (!moved.current && Math.hypot(event.clientX - start.x, event.clientY - start.y) < 5) return;
    if (!moved.current) {
      moved.current = true;
      setDragging(true);
      setWhisper('');
    }
    const bounds = region.current.getBoundingClientRect();
    const rect = pet.current.getBoundingClientRect();
    const next = {
      x: clamp((event.clientX - start.offsetX - bounds.left) / Math.max(1, bounds.width - rect.width)),
      y: clamp((event.clientY - start.offsetY - bounds.top) / Math.max(1, bounds.height - rect.height)),
    };
    positionRef.current = next;
    setPosition(next);
  }

  function finishDrag(event: PointerEvent<HTMLButtonElement>) {
    if (drag.current?.id !== event.pointerId) return;
    drag.current = null;
    setDragging(false);
    if (moved.current) saveLocal(positionKey, positionRef.current);
  }

  function togglePanel(target: 'chat' | 'todo') {
    setWhisper('');
    setPanel(previous => previous === target ? null : target);
  }

  function updateTodos(list: Todo[]) {
    setTodos(list);
    saveLocal(todosKey, list);
  }

  function addTodo(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const text = todoText.trim();
    if (!text || todos.length >= 50) return;
    updateTodos([...todos, { id: crypto.randomUUID(), text, done: false }]);
    setTodoText('');
  }

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

  const placement = position.y >= 0.5 ? 'bottom-full mb-2' : 'top-full mt-2';
  const panelPosition = { left: position.x * 100 + '%', transform: 'translateX(' + (-position.x * 100) + '%)' };
  const size = preferences.bigFishSize === 'regular' || preferences.bigFishSize === 'extra-large' ? preferences.bigFishSize : 'large';

  return (
    <div ref={region} className="pointer-events-none fixed inset-4 z-40">
      <div ref={pet} data-site-pet="big-fish" className={'pointer-events-auto absolute max-h-full max-w-full ' + fishSizes[size]}
        style={{ left: position.x * 100 + '%', top: position.y * 100 + '%', transform: 'translate(' + (-position.x * 100) + '%,' + (-position.y * 100) + '%)' }}>
        {panel === 'chat' && (
          <form id="big-fish-chat" onSubmit={send} className={panelStyle + ' ' + placement} style={panelPosition}>
            <label htmlFor="big-fish-message" className="mb-2 block text-sm font-bold">和大肥鱼聊天</label>
            <div className="flex gap-2">
              <input id="big-fish-message" value={message} onChange={event => setMessage(event.target.value)}
                placeholder="说点什么…" maxLength={1000} disabled={sending} autoFocus className={inputStyle} />
              <button type="submit" disabled={sending || !message.trim()} className={submitStyle}>发送</button>
            </div>
            <p role="status" className="mt-2 max-h-28 overflow-auto whitespace-pre-wrap break-words text-sm">{sending ? '正在想…' : reply}</p>
          </form>
        )}
        {panel === 'todo' && preferences.todoEnabled && (
          <section id="big-fish-todo" aria-label="本地待办" className={panelStyle + ' ' + placement} style={panelPosition}>
            <form onSubmit={addTodo}>
              <label htmlFor="big-fish-todo-text" className="mb-2 block text-sm font-bold">本地待办</label>
              <div className="flex gap-2">
                <input id="big-fish-todo-text" value={todoText} onChange={event => setTodoText(event.target.value)} maxLength={120}
                  placeholder="新增一件待办…" className={inputStyle} />
                <button type="submit" disabled={!todoText.trim() || todos.length >= 50} className={submitStyle}>添加</button>
              </div>
            </form>
            {todos.length === 0 && <p className="mt-2 text-sm">还没有待办。</p>}
            <ul className="mt-2 max-h-28 space-y-2 overflow-auto">
              {todos.map(todo => (
                <li key={todo.id} className="flex items-start gap-2 text-sm">
                  <label className="flex min-w-0 flex-1 items-start gap-2 break-all">
                    <input type="checkbox" checked={todo.done} onChange={() => updateTodos(todos.map(item => item.id === todo.id ? { ...item, done: !item.done } : item))} className="mt-1 accent-indigo-600" />
                    <span className={todo.done ? 'line-through opacity-60' : ''}>{todo.text}</span>
                  </label>
                  <button type="button" aria-label={'删除待办：' + todo.text} onClick={() => updateTodos(todos.filter(item => item.id !== todo.id))} className="shrink-0 text-xs text-indigo-600 dark:text-indigo-300">删除</button>
                </li>
              ))}
            </ul>
          </section>
        )}
        {preferences.whisperEnabled && !panel && !dragging && whisper && (
          <p role="status" className={panelStyle + ' pointer-events-none text-sm ' + placement} style={panelPosition}>{whisper}</p>
        )}
        <div className="absolute left-0 top-0 z-10 flex gap-2">
          <button type="button" onClick={() => togglePanel('chat')} aria-expanded={panel === 'chat'}
            aria-controls={panel === 'chat' ? 'big-fish-chat' : undefined} className={buttonStyle}>{panel === 'chat' ? '关闭聊天' : '聊天'}</button>
          {preferences.todoEnabled && <button type="button" onClick={() => togglePanel('todo')} aria-expanded={panel === 'todo'}
            aria-controls={panel === 'todo' ? 'big-fish-todo' : undefined} className={buttonStyle}>{panel === 'todo' ? '关闭待办' : '待办'}</button>}
        </div>
        <button type="button" aria-label="摸摸大肥鱼，也可以拖动" title="按住大肥鱼可以拖动"
          onPointerDown={startDrag} onPointerMove={moveDrag} onPointerUp={finishDrag}
          onPointerCancel={finishDrag} onLostPointerCapture={finishDrag}
          onClick={event => { if (event.detail === 0 || !moved.current) setPlaying(true); }}
          className="grid h-full w-full touch-none select-none place-items-center overflow-hidden rounded-2xl cursor-grab active:cursor-grabbing focus-visible:outline-2 focus-visible:outline-indigo-500">
          <span className="hidden rounded-xl bg-white/90 px-3 py-2 text-sm text-slate-800 motion-reduce:block">大肥鱼</span>
          {unavailable ? (
            <span className="rounded-xl bg-white/90 px-3 py-2 text-sm text-slate-800 motion-reduce:hidden">大肥鱼</span>
          ) : (
            <video key={playing ? 'happy' : 'idle'} className={'pointer-events-none h-full w-full object-contain motion-reduce:hidden' + (size === 'regular' ? '' : ' scale-125')}
              src={playing ? '/pets/xhblogs-big-fish/happy.webm' : '/pets/xhblogs-big-fish/idle.webm'}
              autoPlay muted playsInline loop={!playing} aria-hidden="true"
              onEnded={() => setPlaying(false)} onError={() => playing ? setPlaying(false) : setUnavailable(true)} />
          )}
        </button>
      </div>
    </div>
  );
}
