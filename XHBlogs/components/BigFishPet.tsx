'use client';

import { useEffect, useRef, useState, type FormEvent, type PointerEvent } from 'react';
import { requestPetReply } from '../lib/petChat';
import BigFishAnimation from './BigFishAnimation';

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
const panelStyle = 'absolute w-72 max-w-[calc(100vw-2rem)] rounded-2xl border border-slate-200 bg-white p-3 text-slate-800 shadow-xl dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100';
const inputStyle = 'min-w-0 flex-1 rounded-lg border border-slate-300 bg-transparent px-2 py-1.5 text-sm dark:border-slate-600';
const submitStyle = 'rounded-lg bg-indigo-600 px-3 text-sm font-bold text-white disabled:opacity-50';

function PetAction({ kind, expanded, onClick }: { kind: 'chat' | 'todo'; expanded: boolean; onClick: () => void }) {
  const label = (expanded ? '关闭' : '') + (kind === 'chat' ? '聊天' : '待办');
  return (
    <button type="button" onClick={onClick} aria-label={label} aria-expanded={expanded}
      aria-controls={expanded ? 'big-fish-' + kind : undefined}
      className={'group relative grid h-11 w-11 place-items-center rounded-full transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500 '
        + (expanded ? 'bg-indigo-500 text-white shadow-sm shadow-indigo-500/40'
          : 'text-slate-600 hover:bg-indigo-100 hover:text-indigo-700 dark:text-slate-200 dark:hover:bg-indigo-400/20 dark:hover:text-white')}>
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"
        aria-hidden="true" className="h-[19px] w-[19px]">
        {kind === 'chat' ? (
          <path d="M20.5 11.5a7.5 7.5 0 0 1-7.5 7.5H8.8l-4.3 2v-5.2A7.5 7.5 0 0 1 10 4h3a7.5 7.5 0 0 1 7.5 7.5ZM8.5 10h7M8.5 13h4" />
        ) : (
          <path d="M9 5H6.5A1.5 1.5 0 0 0 5 6.5v13A1.5 1.5 0 0 0 6.5 21h11a1.5 1.5 0 0 0 1.5-1.5v-13A1.5 1.5 0 0 0 17.5 5H15M9 11l1.25 1.25L12.5 10m1.75 2h1.5m-6.75 4h6.75M10 3h4a1 1 0 0 1 1 1v1a1 1 0 0 1-1 1h-4a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1Z" />
        )}
      </svg>
      <span aria-hidden="true" className="pointer-events-none absolute right-full mr-2 hidden whitespace-nowrap rounded-lg bg-slate-900 px-2 py-1 text-xs font-medium text-white shadow-sm group-hover:block group-focus-visible:block">
        {label}
      </span>
    </button>
  );
}

function readLocal(key: string): unknown {
  try { return JSON.parse(localStorage.getItem(key) ?? 'null'); } catch { return null; }
}
function saveLocal(key: string, value: unknown) {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* Keep the current session usable. */ }
}

export default function BigFishPet({ preferences }: { preferences: Preferences }) {
  const [reaction, setReaction] = useState(0);
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
        <div role="group" aria-label="大肥鱼快捷操作"
          className="absolute right-[5%] top-1/2 z-10 flex -translate-y-1/2 flex-col gap-0.5 rounded-full border border-white/70 bg-white/85 p-1 shadow-lg shadow-slate-950/10 backdrop-blur-md dark:border-white/15 dark:bg-slate-900/75">
          <PetAction kind="chat" expanded={panel === 'chat'} onClick={() => togglePanel('chat')} />
          {preferences.todoEnabled && <PetAction kind="todo" expanded={panel === 'todo'} onClick={() => togglePanel('todo')} />}
        </div>
        <button type="button" aria-label="摸摸大肥鱼，也可以拖动" title="按住大肥鱼可以拖动"
          onPointerDown={startDrag} onPointerMove={moveDrag} onPointerUp={finishDrag}
          onPointerCancel={finishDrag} onLostPointerCapture={finishDrag}
          onClick={event => { if (event.detail === 0 || !moved.current) setReaction(previous => previous + 1); }}
          className="grid h-full w-full touch-none select-none place-items-center overflow-hidden rounded-2xl cursor-grab active:cursor-grabbing focus-visible:outline-2 focus-visible:outline-indigo-500">
          <BigFishAnimation reaction={reaction} enlarged={size !== 'regular'} />
        </button>
      </div>
    </div>
  );
}
