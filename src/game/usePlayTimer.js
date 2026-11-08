import { useEffect, useRef, useState } from 'react';
import { createPlayClock } from '../game/timing.js';
export function usePlayTimer(active, initialMs, initialFreezeMs = 0) {
  const [clock] = useState(() => createPlayClock(initialMs, undefined, initialFreezeMs));
  const [elapsedMs, setElapsedMs] = useState(() => clock.read());
  const [freezeRemainingMs, setFreezeRemainingMs] = useState(() => clock.remainingFreeze());
  const activeRef = useRef(active);
  activeRef.current = active;
  useEffect(() => {
    const landscape = window.matchMedia('(orientation: landscape) and (max-height: 600px)');
    const sync = () => {
      if (active && !landscape.matches && document.visibilityState !== 'hidden') clock.start(); else clock.stop();
      setElapsedMs(clock.read());
    };
    sync();
    document.addEventListener('visibilitychange', sync);
    landscape.addEventListener('change', sync);
    const id = setInterval(() => { setElapsedMs(clock.read()); setFreezeRemainingMs(clock.remainingFreeze()); }, 100);
    return () => { clearInterval(id); landscape.removeEventListener('change', sync); document.removeEventListener('visibilitychange', sync); clock.stop(); };
  }, [active, clock]);
  return {
    elapsedMs, freezeRemainingMs,
    freeze: ms => { const ok=clock.freeze(ms); setElapsedMs(clock.read()); setFreezeRemainingMs(clock.remainingFreeze()); return ok; },
    readFreeze: () => clock.remainingFreeze(),
    stop: () => { const ms=clock.stop(); setElapsedMs(ms); return ms; },
    reset: () => { clock.reset(); setFreezeRemainingMs(0); if(activeRef.current && !window.matchMedia('(orientation: landscape) and (max-height: 600px)').matches && document.visibilityState !== 'hidden') clock.start(); setElapsedMs(0); },
    read: () => clock.read(),
  };
}
