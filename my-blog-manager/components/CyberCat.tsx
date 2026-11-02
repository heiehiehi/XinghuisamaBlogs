"use client";

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function CyberCat() {
  const [isPetted, setIsPetted] = useState(false);
  const [speech, setSpeech] = useState<string | null>(null);
  const [showInput, setShowInput] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [isThinking, setIsThinking] = useState(false);

  const chatTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // --- 🖱️ 拖动状态（自己处理指针事件，避免和点击互动冲突） ---
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const outerRef = useRef<HTMLDivElement | null>(null);
  const dragOffsetRef = useRef({ x: 0, y: 0 });
  const dragStateRef = useRef<{
    pointerId: number;
    startX: number;
    startY: number;
    startLeft: number;
    startTop: number;
    baseX: number;
    baseY: number;
    width: number;
    height: number;
    moved: boolean;
  } | null>(null);
  const isDraggingRef = useRef(false);

  // --- 💬 说话功能 ---
  const speak = (text: string, duration = 6000) => {
    setSpeech(text);
    if (chatTimeoutRef.current) clearTimeout(chatTimeoutRef.current);
    chatTimeoutRef.current = setTimeout(() => {
      setSpeech(null);
    }, duration);
  };

  // --- 🖱️ 交互事件：摸猫猫 ---
  const handlePetCat = () => {
    if (isDraggingRef.current || isPetted) return;
    setIsPetted(true);
    speak("呼噜噜... 摸得本喵很舒服喵~", 2000);
    setTimeout(() => {
      setIsPetted(false);
    }, 2000);
  };

  // --- 🐟 交互事件：喂小鱼干 ---
  const handleFeed = async (e: React.MouseEvent) => {
    e.stopPropagation(); // 阻止触发摸猫或拖拽
    if (isThinking) return;

    setShowInput(false); // 喂食时关掉输入框
    setIsThinking(true);
    speak("嗷呜！真好吃喵！本喵吃饱了要说两句...", 6000);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: "我刚刚喂了你一条美味的小鱼干！你有什么表示？" }),
      });

      if (!res.ok) throw new Error('API Error');

      const data = await res.json();
      speak(data.reply, 8000);
    } catch (error) {
      speak("吧唧吧唧... 鱼干好吃，但本喵卡壳了喵...", 4000);
    } finally {
      setIsThinking(false);
    }
  };

  // --- 💬 交互事件：发送聊天 ---
  const handleChatSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || isThinking) return;

    const userMessage = inputValue;
    setInputValue('');
    setShowInput(false);
    setIsThinking(true);
    speak("让本喵想想喵...", 10000);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMessage }),
      });

      if (!res.ok) throw new Error('API Error');

      const data = await res.json();
      speak(data.reply, 8000);
    } catch (error) {
      speak("铲屎官的网线被老鼠咬断了吧？喵！", 4000);
    } finally {
      setIsThinking(false);
    }
  };

  // --- ⏳ 随机挂机语录 ---
  useEffect(() => {
    const randomBarks = [
      "喵呜~ 今天天气真不错喵~",
      "好困哦，想睡觉喵...",
      "铲屎官，快去敲代码！",
      "我的小鱼干藏哪里去了？",
      "怎么没人理本喵...",
    ];
    const randomTalkInterval = setInterval(() => {
      if (!speech && !showInput && !isThinking && Math.random() > 0.8) {
        const randomMsg = randomBarks[Math.floor(Math.random() * randomBarks.length)];
        speak(randomMsg, 4000);
      }
    }, 20000);

    return () => clearInterval(randomTalkInterval);
  }, [speech, showInput, isThinking]);

  const handleDragPointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (event.button !== 0) return;
    const outer = outerRef.current;
    if (!outer) return;

    const rect = outer.getBoundingClientRect();
    const offset = dragOffsetRef.current;
    dragStateRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      startLeft: rect.left,
      startTop: rect.top,
      baseX: rect.left - offset.x,
      baseY: rect.top - offset.y,
      width: rect.width,
      height: rect.height,
      moved: false,
    };
    setIsDragging(true);

    try {
      event.currentTarget.setPointerCapture?.(event.pointerId);
    } catch {
      // 自动化/触屏环境捕获失败时仍允许当前元素接收指针事件
    }
  };

  const handleDragPointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    const drag = dragStateRef.current;
    if (!drag) return;

    const dx = event.clientX - drag.startX;
    const dy = event.clientY - drag.startY;

    if (!drag.moved && Math.abs(dx) + Math.abs(dy) > 5) {
      drag.moved = true;
      isDraggingRef.current = true;
    }
    if (!drag.moved) return;

    const maxLeft = Math.max(0, window.innerWidth - drag.width);
    const maxTop = Math.max(0, window.innerHeight - drag.height);
    // 从本次按下时的位置继续移动，而不是从初始右下角位置重新算。
    const left = Math.min(Math.max(drag.startLeft + dx, 0), maxLeft);
    const top = Math.min(Math.max(drag.startTop + dy, 0), maxTop);

    const nextOffset = { x: left - drag.baseX, y: top - drag.baseY };
    dragOffsetRef.current = nextOffset;
    setDragOffset(nextOffset);
  };

  const finishDrag = (event: React.PointerEvent<HTMLDivElement>) => {
    const drag = dragStateRef.current;
    if (!drag) return;

    try {
      event.currentTarget.releasePointerCapture?.(drag.pointerId);
    } catch {
      // 指针已释放时忽略
    }

    dragStateRef.current = null;
    setIsDragging(false);

    if (drag.moved) {
      try {
        window.localStorage.setItem('cybercat-offset', JSON.stringify(dragOffsetRef.current));
      } catch {
        // 隐私模式或存储已满时忽略
      }
      // 拖动结束后短暂抑制 click，避免刚拖完又触发“摸猫猫”
      window.setTimeout(() => {
        isDraggingRef.current = false;
      }, 80);
    }
  };

  // 读取上次拖动位置；刷新后仍停在原处，并按当前视口做一次边界收敛。
  useEffect(() => {
    try {
      const saved = JSON.parse(window.localStorage.getItem('cybercat-offset') || 'null') as
        | { x?: unknown; y?: unknown }
        | null;
      if (!saved || typeof saved.x !== 'number' || typeof saved.y !== 'number') return;

      const outer = outerRef.current;
      if (!outer) return;

      const rect = outer.getBoundingClientRect();
      const maxLeft = Math.max(0, window.innerWidth - rect.width);
      const maxTop = Math.max(0, window.innerHeight - rect.height);
      const left = Math.min(Math.max(rect.left + saved.x, 0), maxLeft);
      const top = Math.min(Math.max(rect.top + saved.y, 0), maxTop);
      const next = { x: left - rect.left, y: top - rect.top };

      dragOffsetRef.current = next;
      setDragOffset(next);
    } catch {
      // 读取失败时保持右下角默认位置
    }
  }, []);

  return (
    <motion.div
      ref={outerRef}
      style={{ transform: `translate3d(${dragOffset.x}px, ${dragOffset.y}px, 0)` }}
      className="fixed bottom-20 right-20 z-[9999] flex flex-col items-center group"
    >
      {/* 💬 聊天气泡 */}
      <div className="relative w-full flex justify-center mb-6">
        <AnimatePresence>
          {speech && (
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
              className="absolute bottom-0 bg-white dark:bg-slate-800 text-slate-700 dark:text-gray-200 px-4 py-3 rounded-2xl shadow-xl border border-gray-100 dark:border-slate-700 text-sm max-w-[240px] break-words text-center leading-relaxed"
              style={{ pointerEvents: 'none', transformOrigin: 'bottom center' }}
            >
              {speech}
              <div className="absolute -bottom-[6px] left-1/2 -translate-x-1/2 w-3 h-3 bg-white dark:bg-slate-800 border-b border-r border-gray-100 dark:border-slate-700 transform rotate-45"></div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* 🐈 猫咪本体 & 交互按钮区 */}
      <div className="relative">

        {/* 🌟 核心修改区：去掉了 opacity-0 和 group-hover，让按钮常驻显示 */}
        <div className="absolute -left-12 top-1/2 -translate-y-1/2 flex flex-col gap-2 z-20">

            {/* 💬 聊天按钮 */}
            <button
              onClick={(e) => {
                 e.stopPropagation();
                 setShowInput(!showInput);
              }}
              // 稍微加了一点半透明背景，让常驻按钮在深色背景下也好看
              className="bg-white/90 dark:bg-slate-700/90 p-2.5 rounded-full shadow-md hover:scale-110 active:scale-95 transition-transform border border-gray-100 dark:border-slate-600 text-blue-500 hover:text-blue-600 flex items-center justify-center backdrop-blur-sm"
              title="聊天"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                <path fillRule="evenodd" d="M4.804 21.644A6.707 6.707 0 006 21.75a6.721 6.721 0 003.583-1.029c.774.182 1.584.279 2.417.279 5.322 0 9.75-3.97 9.75-9 0-5.03-4.428-9-9.75-9s-9.75 3.97-9.75 9c0 2.409 1.025 4.587 2.674 6.192.232.226.277.428.254.543a3.73 3.73 0 01-.814 1.686.75.75 0 00.44 1.223zM8.25 10.875a1.125 1.125 0 100 2.25 1.125 1.125 0 000-2.25zM10.875 12a1.125 1.125 0 112.25 0 1.125 1.125 0 01-2.25 0zm4.875-1.125a1.125 1.125 0 100 2.25 1.125 1.125 0 000-2.25z" clipRule="evenodd" />
              </svg>
            </button>

            {/* 🐟 喂食按钮 */}
            <button
              onClick={handleFeed}
              disabled={isThinking}
              className={`bg-white/90 dark:bg-slate-700/90 p-2.5 rounded-full shadow-md hover:scale-110 active:scale-95 transition-transform border border-gray-100 dark:border-slate-600 flex items-center justify-center backdrop-blur-sm ${isThinking ? 'opacity-50 cursor-not-allowed' : ''}`}
              title="喂小鱼干"
            >
              <span className="text-xl leading-none">🐟</span>
            </button>
        </div>

        {/* 猫咪图片容器 */}
        <div
          className={`relative h-[120px] w-[120px] cursor-grab touch-none select-none transition-transform active:cursor-grabbing ${
            isDragging ? 'scale-105' : 'scale-100'
          }`}
          onClick={handlePetCat}
          onPointerDown={handleDragPointerDown}
          onPointerMove={handleDragPointerMove}
          onPointerUp={finishDrag}
          onPointerCancel={finishDrag}
        >
          <style>{`
            .cat-sprite {
              width: 100%;
              height: 100%;
              background-image: url('/siamese-cat.png'); 
              background-size: 300% 300%; 
              background-repeat: no-repeat;
              image-rendering: pixelated; 
            }
            .cat-idle {
              animation: idle-frames 1.2s infinite;
              background-position-y: 0%; 
            }
            .cat-petted {
              animation: pet-frames 0.8s infinite;
              background-position-y: 50%; 
            }
            .cat-thinking {
              animation: idle-frames 0.6s infinite;
              background-position-y: 0%; 
            }
            @keyframes idle-frames {
              0%, 33.32% { background-position-x: 0%; }
              33.33%, 66.65% { background-position-x: 50%; }
              66.66%, 100% { background-position-x: 100%; }
            }
            @keyframes pet-frames {
              0%, 49.99% { background-position-x: 0%; }
              50%, 100% { background-position-x: 50%; }
            }
          `}</style>
          <div className={`cat-sprite drop-shadow-2xl ${isPetted ? 'cat-petted' : isThinking ? 'cat-thinking' : 'cat-idle'}`} />
        </div>
      </div>

      {/* ⌨️ 互动输入框 */}
      <AnimatePresence>
        {showInput && (
          <motion.form
            initial={{ opacity: 0, y: -10, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.9 }}
            onSubmit={handleChatSubmit}
            className="absolute -bottom-14 bg-white dark:bg-slate-800 p-1.5 rounded-full shadow-lg flex items-center border border-gray-200 dark:border-slate-700 w-56 z-20"
          >
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="跟煤球说点啥喵..."
              className="bg-transparent border-none outline-none text-sm px-3 py-1 w-full dark:text-white placeholder-gray-400"
              disabled={isThinking}
              autoFocus
            />
            <button
              type="submit"
              disabled={isThinking || !inputValue.trim()}
              className={`rounded-full p-1.5 ml-1 flex items-center justify-center transition-colors ${
                isThinking || !inputValue.trim() ? 'bg-gray-300 text-gray-500' : 'bg-blue-500 hover:bg-blue-600 text-white'
              }`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                <path d="M3.105 2.289a.75.75 0 00-.826.95l1.414 4.925A1.5 1.5 0 005.135 9.25h6.115a.75.75 0 010 1.5H5.135a1.5 1.5 0 00-1.442 1.086l-1.414 4.926a.75.75 0 00.826.95 28.896 28.896 0 0015.293-7.154.75.75 0 000-1.115A28.897 28.897 0 003.105 2.289z" />
              </svg>
            </button>
          </motion.form>
        )}
      </AnimatePresence>
    </motion.div>
  );
}