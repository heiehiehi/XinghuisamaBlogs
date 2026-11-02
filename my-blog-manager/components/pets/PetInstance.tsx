"use client";

import React, { useEffect, useRef, useState } from 'react';
import {
  CLICK_LINES,
  ChatMessage,
  DEFAULT_PET_PERSONA,
  PET_CATALOG,
  PetConfig,
  PetTodo,
  clamp,
  petVideoUrl,
  pickOne,
} from './petCatalog';

interface Vec {
  x: number;
  y: number;
}

interface PetInstanceProps {
  config: PetConfig;
  index: number;
  showSettingsLink?: boolean;
}

function readJson<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function writeJson(key: string, value: unknown): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // 存储空间满或隐私模式时静默忽略
  }
}

export default function PetInstance({ config, index, showSettingsLink = false }: PetInstanceProps) {
  const size = clamp(config.size ?? 220, 96, 420);
  const stageHeight = Math.round((size * 9) / 16);

  const [pos, setPos] = useState<Vec>({ x: -9999, y: -9999 });
  const [dragging, setDragging] = useState(false);
  const [facing, setFacing] = useState<'left' | 'right'>('right');
  const [bubble, setBubble] = useState<string | null>(null);
  const [menu, setMenu] = useState<{ x: number; y: number } | null>(null);
  const [chatOpen, setChatOpen] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [chatBusy, setChatBusy] = useState(false);
  const [sleeping, setSleeping] = useState(false);
  const [todoOpen, setTodoOpen] = useState(false);
  const [todos, setTodos] = useState<PetTodo[]>([]);
  const [todoDraft, setTodoDraft] = useState('');
  const [todoDue, setTodoDue] = useState('');
  const [frontSlot, setFrontSlot] = useState(0);
  const [viewport, setViewport] = useState({ w: 0, h: 0 });

  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const videoA = useRef<HTMLVideoElement | null>(null);
  const videoB = useRef<HTMLVideoElement | null>(null);
  const chatInputRef = useRef<HTMLInputElement | null>(null);

  const posRef = useRef<Vec>({ x: 0, y: 0 });
  const draggingRef = useRef(false);
  const sleepingRef = useRef(false);
  const chatOpenRef = useRef(false);
  const busyRef = useRef(false);
  const frontRef = useRef(0);
  const genRef = useRef(0);
  const afterEndRef = useRef<(() => void) | null>(null);
  const bubbleTimerRef = useRef<number | null>(null);
  const rafRef = useRef<number | null>(null);
  const dragRef = useRef<{
    pointerId: number;
    startX: number;
    startY: number;
    startPos: Vec;
    moved: boolean;
    samples: { x: number; y: number; t: number }[];
  } | null>(null);
  const todosRef = useRef<PetTodo[]>([]);
  const chatHistoryRef = useRef<ChatMessage[]>([]);

  const todoKey = `pet-todos-${config.id}`;
  const chatKey = `pet-chat-${config.id}`;
  const posKey = `pet-pos-${config.id}`;

  function clampPos(x: number, y: number): Vec {
    const maxX = Math.max(0, window.innerWidth - size);
    const maxY = Math.max(0, window.innerHeight - stageHeight);
    return { x: clamp(x, 0, maxX), y: clamp(y, 0, maxY) };
  }

  function savePosition(next: Vec = posRef.current): void {
    writeJson(posKey, next);
  }

  function showBubble(text: string, duration = 4000): void {
    setBubble(text);
    if (bubbleTimerRef.current !== null) window.clearTimeout(bubbleTimerRef.current);
    bubbleTimerRef.current = window.setTimeout(() => setBubble(null), duration);
  }

  function computeInitialPosition(): Vec {
    const stored = readJson<Vec | null>(posKey, null);
    if (stored && typeof stored.x === 'number' && typeof stored.y === 'number') {
      return clampPos(stored.x, stored.y);
    }
    const ox = config.offsetX ?? 24;
    const oy = config.offsetY ?? 16;
    const corner = config.corner ?? 'bottom-left';
    let x = corner.includes('left') ? ox : window.innerWidth - size - ox;
    let y = corner.includes('top') ? oy : window.innerHeight - stageHeight - oy;
    const direction = corner.includes('left') ? 1 : -1;
    x += direction * index * 30;
    y -= index * 14;
    return clampPos(x, y);
  }

  function switchTo(
    name: string,
    opts: { loop?: boolean; afterEnd?: () => void } = {},
  ): void {
    if (typeof window === 'undefined') return;
    const nextSlot = frontRef.current === 0 ? 1 : 0;
    const el = nextSlot === 0 ? videoA.current : videoB.current;
    const prev = frontRef.current === 0 ? videoA.current : videoB.current;
    if (!el) return;

    const gen = ++genRef.current;
    afterEndRef.current = opts.afterEnd ?? null;
    el.oncanplay = null;
    el.loop = Boolean(opts.loop);
    el.muted = true;
    el.src = petVideoUrl(name);
    try {
      el.currentTime = 0;
    } catch {
      // 视频尚未可寻址时忽略
    }
    void el.play().catch(() => undefined);

    frontRef.current = nextSlot;

    const show = () => {
      if (gen !== genRef.current) return;
      setFrontSlot(nextSlot);
      window.setTimeout(() => {
        if (gen === genRef.current) prev?.pause();
      }, 260);
    };

    if (el.readyState >= 2) show();
    else {
      el.oncanplay = show;
      window.setTimeout(show, 160);
    }
  }

  function goIdle(): void {
    if (sleepingRef.current) return;
    switchTo(PET_CATALOG.idle, { loop: true });
  }

  function doSleep(): void {
    if (sleepingRef.current) return;
    sleepingRef.current = true;
    setSleeping(true);
    setChatOpen(false);
    chatOpenRef.current = false;
    setTodoOpen(false);
    setMenu(null);
    showBubble('那我先睡啦，晚安~', 3000);
    switchTo(PET_CATALOG.sleep.start, {
      afterEnd: () => switchTo(PET_CATALOG.sleep.loop, { loop: true }),
    });
  }

  function wake(): void {
    if (!sleepingRef.current) return;
    switchTo(PET_CATALOG.sleep.end, {
      afterEnd: () => {
        sleepingRef.current = false;
        setSleeping(false);
        goIdle();
        showBubble('唔…我醒了。', 3000);
      },
    });
  }

  function playAction(name: string, flipAfter = false): void {
    switchTo(name, {
      afterEnd: () => {
        if (flipAfter) setFacing((prev) => (prev === 'right' ? 'left' : 'right'));
        goIdle();
      },
    });
  }

  function handleClickResponse(): void {
    if (sleepingRef.current) {
      wake();
      return;
    }
    if (busyRef.current) {
      showBubble('让我先想完这句话…', 2000);
      return;
    }
    showBubble(pickOne(CLICK_LINES), 3000);
    playAction(pickOne(PET_CATALOG.clicks));
  }

  function handleEnded(event: React.SyntheticEvent<HTMLVideoElement>): void {
    const slot = event.currentTarget === videoA.current ? 0 : 1;
    if (slot !== frontRef.current) return;
    const callback = afterEndRef.current;
    afterEndRef.current = null;
    callback?.();
  }

  function buildSystemPrompt(extra = ''): string {
    const base = (config.persona || DEFAULT_PET_PERSONA).trim();
    const rule = `你的名字是「${config.name}」。回答尽量简短自然，不要解释自己，不要提你是AI。`;
    return `${base}\n${rule}${extra ? `\n${extra}` : ''}`;
  }

  async function askAI(message: string, history: ChatMessage[], extra = ''): Promise<string> {
    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message,
        systemPrompt: buildSystemPrompt(extra),
        history,
      }),
    });
    if (!res.ok) throw new Error('chat request failed');
    const data = await res.json();
    const reply = String(data?.reply || '').trim();
    return reply || '……';
  }

  function openChat(): void {
    if (sleepingRef.current) {
      showBubble('我在睡觉，别烦我…', 2500);
      return;
    }
    setMenu(null);
    setTodoOpen(false);
    setChatOpen(true);
    chatOpenRef.current = true;
    window.setTimeout(() => chatInputRef.current?.focus(), 80);
  }

  async function sendChat(event: React.FormEvent): Promise<void> {
    event.preventDefault();
    const text = chatInput.trim();
    if (!text || busyRef.current) return;

    setChatInput('');
    busyRef.current = true;
    setChatBusy(true);
    showBubble('让我想想…', 10000);

    try {
      const history = chatHistoryRef.current.slice(-6);
      const reply = await askAI(text, history, '请用一两句话自然回复主人。');
      const nextHistory = [
        ...history,
        { role: 'user' as const, content: text },
        { role: 'assistant' as const, content: reply },
      ].slice(-8);
      chatHistoryRef.current = nextHistory;
      writeJson(chatKey, nextHistory);
      showBubble(reply, 8000);
    } catch {
      showBubble('呜…网络好像断开了。', 4000);
    } finally {
      busyRef.current = false;
      setChatBusy(false);
    }
  }

  function updateTodos(next: PetTodo[]): void {
    todosRef.current = next;
    setTodos(next);
    writeJson(todoKey, next);
  }

  function addTodo(event: React.FormEvent): void {
    event.preventDefault();
    const text = todoDraft.trim();
    if (!text) return;
    const dueAt = todoDue ? new Date(todoDue).getTime() : null;
    const item: PetTodo = {
      id: Math.random().toString(36).slice(2, 9),
      text,
      dueAt: Number.isFinite(dueAt) ? dueAt : null,
      done: false,
      reminded: false,
    };
    updateTodos([item, ...todosRef.current]);
    setTodoDraft('');
    setTodoDue('');
  }

  function toggleTodo(id: string): void {
    updateTodos(todosRef.current.map((item) => (item.id === id ? { ...item, done: !item.done } : item)));
  }

  function removeTodo(id: string): void {
    updateTodos(todosRef.current.filter((item) => item.id !== id));
  }

  function formatDue(dueAt: number | null): string {
    if (!dueAt) return '无期限';
    return new Date(dueAt).toLocaleString('zh-CN', {
      month: 'numeric',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  function resetPosition(): void {
    setMenu(null);
    const ox = config.offsetX ?? 24;
    const oy = config.offsetY ?? 16;
    const corner = config.corner ?? 'bottom-left';
    let x = corner.includes('left') ? ox : window.innerWidth - size - ox;
    let y = corner.includes('top') ? oy : window.innerHeight - stageHeight - oy;
    const direction = corner.includes('left') ? 1 : -1;
    x += direction * index * 30;
    y -= index * 14;
    const next = clampPos(x, y);
    posRef.current = next;
    setPos(next);
    savePosition(next);
  }

  function startInertia(vx: number, vy: number): void {
    let last = performance.now();
    const frame = (now: number) => {
      const dt = Math.min(Math.max((now - last) / 1000, 0.001), 0.05);
      last = now;

      let x = posRef.current.x + vx * dt;
      let y = posRef.current.y + vy * dt;
      const maxX = Math.max(0, window.innerWidth - size);
      const maxY = Math.max(0, window.innerHeight - stageHeight);

      if (x < 0) {
        x = 0;
        vx = Math.abs(vx) * 0.55;
      } else if (x > maxX) {
        x = maxX;
        vx = -Math.abs(vx) * 0.55;
      }
      if (y < 0) {
        y = 0;
        vy = Math.abs(vy) * 0.55;
      } else if (y > maxY) {
        y = maxY;
        vy = -Math.abs(vy) * 0.55;
      }

      const friction = Math.pow(0.9, dt * 60);
      vx *= friction;
      vy *= friction;

      posRef.current = { x, y };
      setPos({ x, y });

      if (Math.hypot(vx, vy) > 25) {
        rafRef.current = window.requestAnimationFrame(frame);
      } else {
        savePosition();
      }
    };

    if (rafRef.current !== null) window.cancelAnimationFrame(rafRef.current);
    rafRef.current = window.requestAnimationFrame(frame);
  }

  function onPointerDown(event: React.PointerEvent<HTMLDivElement>): void {
    if (event.button !== 0) return;
    if (sleepingRef.current) {
      wake();
      return;
    }
    event.preventDefault();
    setMenu(null);

    dragRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      startPos: { ...posRef.current },
      moved: false,
      samples: [{ x: event.clientX, y: event.clientY, t: performance.now() }],
    };
    draggingRef.current = true;
    setDragging(true);

    // 某些自动化/触屏环境里 pointerId 可能已失效，捕获失败不应阻断点击。
    try {
      event.currentTarget.setPointerCapture?.(event.pointerId);
    } catch {
      // 捕获失败时仍允许当前元素接收 pointerup
    }

    if (rafRef.current !== null) {
      window.cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    switchTo(PET_CATALOG.drag, { loop: true });
  }

  function onPointerMove(event: React.PointerEvent<HTMLDivElement>): void {
    const drag = dragRef.current;
    if (!drag) return;

    const dx = event.clientX - drag.startX;
    const dy = event.clientY - drag.startY;
    if (Math.abs(dx) + Math.abs(dy) > 5) drag.moved = true;

    const next = clampPos(drag.startPos.x + dx, drag.startPos.y + dy);
    posRef.current = next;
    setPos(next);

    drag.samples.push({ x: event.clientX, y: event.clientY, t: performance.now() });
    if (drag.samples.length > 6) drag.samples.shift();
  }

  function onPointerUp(event: React.PointerEvent<HTMLDivElement>): void {
    const drag = dragRef.current;
    if (!drag) return;

    try {
      event.currentTarget.releasePointerCapture?.(drag.pointerId);
    } catch {
      // 指针已释放时忽略
    }

    dragRef.current = null;
    draggingRef.current = false;
    setDragging(false);

    if (!drag.moved) {
      handleClickResponse();
      return;
    }

    const samples = drag.samples;
    const first = samples[0];
    const last = samples[samples.length - 1];
    const dt = Math.max((last.t - first.t) / 1000, 0.02);
    const vx = clamp((last.x - first.x) / dt, -1400, 1400);
    const vy = clamp((last.y - first.y) / dt, -1400, 1400);
    startInertia(vx, vy);
    window.setTimeout(() => {
      if (!sleepingRef.current && !draggingRef.current) goIdle();
    }, 420);
  }

  function onPointerCancel(): void {
    dragRef.current = null;
    draggingRef.current = false;
    setDragging(false);
    if (!sleepingRef.current) goIdle();
  }

  useEffect(() => {
    const initial = computeInitialPosition();
    posRef.current = initial;
    setPos(initial);
    setViewport({ w: window.innerWidth, h: window.innerHeight });

    const savedTodos = readJson<PetTodo[]>(todoKey, []);
    todosRef.current = savedTodos;
    setTodos(savedTodos);

    const savedChat = readJson<ChatMessage[]>(chatKey, []);
    chatHistoryRef.current = savedChat;

    switchTo(PET_CATALOG.idle, { loop: true });

    const onResize = () => {
      setViewport({ w: window.innerWidth, h: window.innerHeight });
      const next = clampPos(posRef.current.x, posRef.current.y);
      posRef.current = next;
      setPos(next);
    };
    window.addEventListener('resize', onResize);

    return () => {
      window.removeEventListener('resize', onResize);
      if (bubbleTimerRef.current !== null) window.clearTimeout(bubbleTimerRef.current);
      if (rafRef.current !== null) window.cancelAnimationFrame(rafRef.current);
      genRef.current += 1;
      [videoA.current, videoB.current].forEach((video) => {
        if (!video) return;
        video.pause();
        video.removeAttribute('src');
        video.load();
      });
    };
    // 组件只在挂载时初始化一次；配置变更通过重新挂载生效。
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    chatOpenRef.current = chatOpen;
  }, [chatOpen]);

  // 随机小动作：每隔几秒有概率抽一段，播完回到待机。
  useEffect(() => {
    const timer = window.setInterval(() => {
      if (
        sleepingRef.current ||
        draggingRef.current ||
        chatOpenRef.current ||
        busyRef.current ||
        afterEndRef.current ||
        document.hidden
      ) {
        return;
      }
      if (Math.random() > 0.4) return;

      if (Math.random() < 0.22) {
        playAction(PET_CATALOG.turn, true);
      } else {
        playAction(pickOne(PET_CATALOG.random));
      }
    }, 4000);

    return () => window.clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 定期碎碎念：调用现有 /api/chat 生成一句话。
  useEffect(() => {
    if (!config.whisperEnabled) return;
    const seconds = clamp(config.whisperIntervalSec ?? 300, 60, 3600);
    let cancelled = false;

    const tick = async () => {
      if (
        cancelled ||
        sleepingRef.current ||
        draggingRef.current ||
        chatOpenRef.current ||
        busyRef.current ||
        afterEndRef.current ||
        document.hidden
      ) {
        return;
      }

      switchTo(pickOne(PET_CATALOG.whisper), {
        afterEnd: () => goIdle(),
      });
      busyRef.current = true;
      setChatBusy(true);

      try {
        const reply = await askAI('请用一句话碎碎念，20字以内，不要解释，不要提你是AI。', []);
        if (!cancelled) showBubble(reply, 7000);
      } catch {
        if (!cancelled) showBubble('呜…今天的网有点慢。', 4000);
      } finally {
        if (!cancelled) {
          busyRef.current = false;
          setChatBusy(false);
        }
      }
    };

    const timer = window.setInterval(() => {
      void tick();
    }, seconds * 1000);

    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [config.whisperEnabled, config.whisperIntervalSec]);

  // 待办到期提醒：只提醒一次。
  useEffect(() => {
    const timer = window.setInterval(() => {
      const now = Date.now();
      const due = todosRef.current.find(
        (item) => !item.done && item.dueAt !== null && item.dueAt <= now && !item.reminded,
      );
      if (!due) return;

      const next = todosRef.current.map((item) =>
        item.id === due.id ? { ...item, reminded: true } : item,
      );
      todosRef.current = next;
      setTodos(next);
      writeJson(todoKey, next);
      showBubble(`⏰ 该做「${due.text}」啦！`, 8000);
    }, 30000);

    return () => window.clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const positioned = pos.x >= 0;

  const menuWidth = 184;
  const menuLeft = menu
    ? clamp(menu.x, 8, Math.max(8, viewport.w - menuWidth - 8))
    : 0;
  const menuTop = menu ? clamp(menu.y, 8, Math.max(8, viewport.h - 300)) : 0;

  const chatLeft = clamp(pos.x, 8, Math.max(8, viewport.w - 276));
  const chatTop =
    pos.y + stageHeight + 10 < viewport.h - 72
      ? pos.y + stageHeight + 10
      : clamp(pos.y - 58, 8, Math.max(8, viewport.h - 64));

  const todoLeft = clamp(pos.x, 8, Math.max(8, viewport.w - 296));
  const todoTop = clamp(pos.y - 300, 8, Math.max(8, viewport.h - 330));
  const bubbleBelow = pos.y < 110;

  return (
    <>
      <div
        ref={wrapperRef}
        data-pet-id={config.id}
        data-pet-instance
        className="select-none"
        style={{
          position: 'fixed',
          left: pos.x,
          top: pos.y,
          width: size,
          height: stageHeight,
          zIndex: dragging ? 100 : 40 + index,
          visibility: positioned ? 'visible' : 'hidden',
        }}
      >
        {bubble && (
          <div
            className={`pointer-events-none absolute left-1/2 z-20 w-max max-w-[220px] -translate-x-1/2 rounded-2xl border border-indigo-100/70 bg-white/95 px-3 py-2 text-center text-xs font-medium leading-relaxed text-slate-700 shadow-xl backdrop-blur dark:border-indigo-400/20 dark:bg-slate-800/95 dark:text-slate-100 ${
              bubbleBelow ? 'top-full mt-2' : 'bottom-full mb-2'
            }`}
          >
            {bubble}
            <div
              className={`absolute left-1/2 h-2 w-2 -translate-x-1/2 rotate-45 bg-white/95 dark:bg-slate-800/95 ${
                bubbleBelow ? '-top-1' : '-bottom-1'
              }`}
            />
          </div>
        )}

        <div
          className={`relative h-full w-full transition-transform duration-200 ${
            dragging ? 'scale-[1.04]' : 'scale-100'
          }`}
          style={{
            transform: facing === 'left' ? 'scaleX(-1)' : undefined,
            filter: 'drop-shadow(0 12px 18px rgba(15, 23, 42, 0.18))',
          }}
          onContextMenu={(event) => {
            event.preventDefault();
            event.stopPropagation();
            setMenu({ x: event.clientX, y: event.clientY });
          }}
        >
          <video
            ref={videoA}
            muted
            playsInline
            preload="auto"
            onEnded={handleEnded}
            className={`pointer-events-none absolute inset-0 h-full w-full object-contain transition-opacity duration-200 ${
              frontSlot === 0 ? 'opacity-100' : 'opacity-0'
            }`}
          />
          <video
            ref={videoB}
            muted
            playsInline
            preload="auto"
            onEnded={handleEnded}
            className={`pointer-events-none absolute inset-0 h-full w-full object-contain transition-opacity duration-200 ${
              frontSlot === 1 ? 'opacity-100' : 'opacity-0'
            }`}
          />

          {/* 交互热区单独盖在视频上，视频本身不接收指针事件。 */}
          <div
            data-pet-hit
            className={`absolute inset-0 z-10 touch-none ${
              dragging ? 'cursor-grabbing' : 'cursor-grab'
            }`}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={onPointerCancel}
            onClick={(event) => {
              // 拖拽结束的 pointerup 已处理点击；这里只阻止冒泡
              event.stopPropagation();
            }}
          />

          {sleeping && (
            <div className="pointer-events-none absolute -top-5 left-1/2 z-20 -translate-x-1/2 text-lg font-black text-indigo-500 dark:text-indigo-300">
              💤
            </div>
          )}
        </div>
      </div>

      {menu && (
        <>
          <div
            className="fixed inset-0 z-[10030]"
            onClick={() => setMenu(null)}
            onContextMenu={(event) => {
              event.preventDefault();
              setMenu(null);
            }}
          />
          <div
            className="fixed z-[10040] overflow-hidden rounded-2xl border border-white/60 bg-white/95 p-1.5 text-xs font-bold text-slate-700 shadow-2xl backdrop-blur-xl dark:border-slate-700/60 dark:bg-slate-900/95 dark:text-slate-200"
            style={{ left: menuLeft, top: menuTop, width: menuWidth }}
          >
            <div className="px-3 py-2 text-[10px] font-black uppercase tracking-widest text-slate-400">
              {config.name}
            </div>

            {config.chatEnabled !== false && (
              <button
                type="button"
                onClick={openChat}
                className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left hover:bg-indigo-500/10"
              >
                💬 聊两句
              </button>
            )}

            {config.todoEnabled !== false && (
              <button
                type="button"
                onClick={() => {
                  setMenu(null);
                  setTodoOpen((prev) => !prev);
                }}
                className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left hover:bg-indigo-500/10"
              >
                📝 待办清单
                {todos.filter((item) => !item.done).length > 0 && (
                  <span className="ml-auto rounded-full bg-indigo-500 px-1.5 py-0.5 text-[10px] text-white">
                    {todos.filter((item) => !item.done).length}
                  </span>
                )}
              </button>
            )}

            <button
              type="button"
              onClick={() => {
                setMenu(null);
                if (sleepingRef.current) wake();
                else doSleep();
              }}
              className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left hover:bg-indigo-500/10"
            >
              {sleeping ? '☀️ 叫醒' : '🌙 睡觉'}
            </button>

            <button
              type="button"
              onClick={() => {
                setMenu(null);
                if (!sleepingRef.current) playAction(pickOne(PET_CATALOG.random));
              }}
              className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left hover:bg-indigo-500/10"
            >
              🎲 随机动一下
            </button>

            <button
              type="button"
              onClick={resetPosition}
              className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left hover:bg-indigo-500/10"
            >
              🏠 回到初始位置
            </button>

            {showSettingsLink && (
              <a
                href="/settings?tab=pets"
                className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-indigo-600 hover:bg-indigo-500/10 dark:text-indigo-300"
              >
                ⚙️ 宠物设置
              </a>
            )}

            <a
              href="https://github.com/PC2005-cloud/dsh-pet"
              target="_blank"
              rel="noreferrer"
              className="mt-1 block rounded-xl border-t border-slate-200/60 px-3 py-2 text-[10px] font-medium text-slate-400 hover:text-indigo-500 dark:border-slate-700/60"
            >
              素材：dsh-pet · CC BY-NC-SA 4.0
            </a>
          </div>
        </>
      )}

      {chatOpen && (
        <form
          onSubmit={sendChat}
          className="fixed z-[10040] flex items-center gap-1.5 rounded-2xl border border-white/60 bg-white/95 p-1.5 shadow-2xl backdrop-blur-xl dark:border-slate-700/60 dark:bg-slate-900/95"
          style={{ left: chatLeft, top: chatTop, width: 268 }}
        >
          <input
            ref={chatInputRef}
            value={chatInput}
            onChange={(event) => setChatInput(event.target.value)}
            placeholder={`和${config.name}说点什么…`}
            disabled={chatBusy}
            className="min-w-0 flex-1 bg-transparent px-2.5 py-1.5 text-xs font-medium text-slate-700 outline-none placeholder-slate-400 dark:text-slate-100"
          />
          <button
            type="submit"
            disabled={chatBusy || !chatInput.trim()}
            className="rounded-xl bg-indigo-500 px-3 py-1.5 text-xs font-black text-white transition-colors hover:bg-indigo-600 disabled:cursor-not-allowed disabled:bg-slate-300 dark:disabled:bg-slate-700"
          >
            {chatBusy ? '…' : '发送'}
          </button>
          <button
            type="button"
            aria-label="关闭聊天"
            onClick={() => {
              setChatOpen(false);
              chatOpenRef.current = false;
            }}
            className="rounded-xl px-2 py-1.5 text-xs font-black text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            ×
          </button>
        </form>
      )}

      {todoOpen && (
        <div
          className="fixed z-[10040] flex max-h-[330px] w-[288px] flex-col overflow-hidden rounded-2xl border border-white/60 bg-white/95 p-3 shadow-2xl backdrop-blur-xl dark:border-slate-700/60 dark:bg-slate-900/95"
          style={{ left: todoLeft, top: todoTop }}
        >
          <div className="mb-2 flex items-center justify-between">
            <p className="text-xs font-black text-slate-700 dark:text-slate-100">📝 {config.name}的待办</p>
            <button
              type="button"
              aria-label="关闭待办"
              onClick={() => setTodoOpen(false)}
              className="text-xs font-black text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              ×
            </button>
          </div>

          <div className="mb-2 min-h-[40px] flex-1 space-y-1.5 overflow-y-auto pr-1">
            {todos.length === 0 && (
              <p className="py-4 text-center text-[11px] font-medium text-slate-400">
                还没有待办，添加一条吧~
              </p>
            )}
            {todos.map((item) => (
              <div
                key={item.id}
                className="flex items-start gap-2 rounded-xl bg-slate-50/80 px-2.5 py-2 dark:bg-slate-800/70"
              >
                <input
                  type="checkbox"
                  checked={item.done}
                  onChange={() => toggleTodo(item.id)}
                  className="mt-0.5 h-3.5 w-3.5 shrink-0 accent-indigo-500"
                />
                <button
                  type="button"
                  onClick={() => toggleTodo(item.id)}
                  className="min-w-0 flex-1 text-left"
                >
                  <span
                    className={`block break-words text-[11px] font-bold leading-snug ${
                      item.done
                        ? 'text-slate-400 line-through'
                        : 'text-slate-700 dark:text-slate-200'
                    }`}
                  >
                    {item.text}
                  </span>
                  <span className="mt-0.5 block text-[9px] font-medium text-slate-400">
                    {formatDue(item.dueAt)}
                  </span>
                </button>
                <button
                  type="button"
                  aria-label="删除待办"
                  onClick={() => removeTodo(item.id)}
                  className="shrink-0 text-[10px] font-black text-slate-300 hover:text-rose-500"
                >
                  ×
                </button>
              </div>
            ))}
          </div>

          <form onSubmit={addTodo} className="space-y-1.5 border-t border-slate-200/60 pt-2 dark:border-slate-700/60">
            <input
              value={todoDraft}
              onChange={(event) => setTodoDraft(event.target.value)}
              placeholder="要做什么？"
              className="w-full rounded-xl border border-slate-200 bg-white/80 px-2.5 py-1.5 text-[11px] font-medium text-slate-700 outline-none focus:border-indigo-400 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
            />
            <div className="flex gap-1.5">
              <input
                type="datetime-local"
                value={todoDue}
                onChange={(event) => setTodoDue(event.target.value)}
                className="min-w-0 flex-1 rounded-xl border border-slate-200 bg-white/80 px-2 py-1 text-[10px] font-medium text-slate-500 outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
              />
              <button
                type="submit"
                disabled={!todoDraft.trim()}
                className="rounded-xl bg-indigo-500 px-3 py-1 text-[10px] font-black text-white hover:bg-indigo-600 disabled:cursor-not-allowed disabled:bg-slate-300 dark:disabled:bg-slate-700"
              >
                添加
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}
