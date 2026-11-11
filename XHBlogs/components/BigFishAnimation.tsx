'use client';

import { useEffect, useRef, useState } from 'react';

const assets = '/pets/xhblogs-big-fish';
const corners = [3, 15, 51, 63];
const frameSize = 512;

export default function BigFishAnimation({ reaction, enlarged }: { reaction: number; enlarged: boolean }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const idle = useRef<HTMLVideoElement>(null);
  const happy = useRef<HTMLVideoElement>(null);
  const playReaction = useRef<(() => void) | null>(null);
  const [ready, setReady] = useState(false);
  const [unavailable, setUnavailable] = useState(false);

  useEffect(() => {
    const target = canvas.current;
    const idleVideo = idle.current;
    const happyVideo = happy.current;
    const output = target?.getContext('2d', { alpha: true });
    const probe = document.createElement('canvas');
    probe.width = probe.height = 4;
    const sample = probe.getContext('2d', { alpha: true, willReadFrequently: true });
    if (!target || !output || !sample || !idleVideo || !happyVideo) {
      setUnavailable(true);
      return;
    }
    output.globalCompositeOperation = sample.globalCompositeOperation = 'copy';
    let disposed = false;
    let reacting = false;
    let showingReaction = false;
    let drewFrame = false;
    const showFallback = () => { if (!drewFrame) setUnavailable(true); };
    const loadingTimeout = window.setTimeout(showFallback, 2500);

    function watch(video: HTMLVideoElement, clip: 'idle' | 'happy') {
      const videoClock = typeof video.requestVideoFrameCallback === 'function';
      let next = 0;
      let lastTime = -1;
      function tick() {
        if (disposed) return;
        if ((clip === 'happy' ? reacting : !showingReaction)
          && video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA
          && video.videoWidth && video.videoHeight
          && (videoClock || video.currentTime !== lastTime)) {
          lastTime = video.currentTime;
          // A decoded frame must retain some corner transparency. Hold the
          // previous good frame if a decoder returns a solid rectangle.
          sample!.drawImage(video, 0, 0, 4, 4);
          const alpha = sample!.getImageData(0, 0, 4, 4).data;
          const hasArtwork = alpha.some((value, index) => index % 4 === 3 && value > 4);
          if (hasArtwork && !corners.every(index => alpha[index] >= 250)) {
            const scale = Math.min(frameSize / video.videoWidth, frameSize / video.videoHeight);
            const w = video.videoWidth * scale;
            const h = video.videoHeight * scale;
            output!.drawImage(video, (frameSize - w) / 2, (frameSize - h) / 2, w, h);
            if (clip === 'happy') showingReaction = true;
            if (target!.dataset.clip !== clip) target!.dataset.clip = clip;
            if (!drewFrame) {
              drewFrame = true;
              window.clearTimeout(loadingTimeout);
              setReady(true);
            }
          }
        }
        schedule();
      }
      function schedule() {
        next = videoClock ? video.requestVideoFrameCallback(tick) : requestAnimationFrame(tick);
      }
      schedule();
      return () => {
        if (videoClock) video.cancelVideoFrameCallback(next);
        else cancelAnimationFrame(next);
      };
    }
    const stopIdle = watch(idleVideo, 'idle');
    const stopHappy = watch(happyVideo, 'happy');
    const finish = () => { reacting = false; showingReaction = false; };
    happyVideo.addEventListener('ended', finish);
    happyVideo.addEventListener('error', finish);
    idleVideo.addEventListener('error', showFallback);
    playReaction.current = () => {
      if (reacting || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
      reacting = true;
      happyVideo.currentTime = 0;
      void happyVideo.play().catch(finish);
    };
    return () => {
      disposed = true;
      stopIdle();
      stopHappy();
      window.clearTimeout(loadingTimeout);
      playReaction.current = null;
      happyVideo.removeEventListener('ended', finish);
      happyVideo.removeEventListener('error', finish);
      idleVideo.removeEventListener('error', showFallback);
    };
  }, []);

  useEffect(() => {
    if (reaction > 0) playReaction.current?.();
  }, [reaction]);

  return (
    <>
      <video ref={idle} src={assets + '/idle.webm'} autoPlay loop muted playsInline
        className="pointer-events-none absolute h-px w-px opacity-0" aria-hidden="true" />
      <video ref={happy} src={assets + '/happy.webm'} preload="auto" muted playsInline
        className="pointer-events-none absolute h-px w-px opacity-0" aria-hidden="true" />
      <span className={'rounded-xl bg-slate-900/80 px-3 py-2 text-sm text-white ' + (!ready && unavailable ? '' : 'hidden motion-reduce:block')}>大肥鱼</span>
      <canvas ref={canvas} width={frameSize} height={frameSize} aria-hidden="true"
        className={'pointer-events-none h-full w-full bg-transparent motion-reduce:hidden' + (ready ? '' : ' hidden') + (enlarged ? ' scale-125' : '')} />
    </>
  );
}
