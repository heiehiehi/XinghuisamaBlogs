'use client';

import { useState } from 'react';

export default function BigFishPet() {
  const [playing, setPlaying] = useState(false);
  const [unavailable, setUnavailable] = useState(false);
  return (
    <button type="button" data-site-pet="big-fish" aria-label="摸摸大肥鱼"
      onClick={() => setPlaying(true)}
      className="fixed bottom-4 right-4 z-40 grid h-36 w-36 place-items-center rounded-2xl focus-visible:outline-2 focus-visible:outline-indigo-500 md:h-48 md:w-48">
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
  );
}
