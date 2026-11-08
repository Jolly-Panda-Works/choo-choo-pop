import { useEffect, useRef, useState } from 'react';
import { createPlayClock } from '../game/timing.js';
export function usePlayTimer(active, initialMs) {
  const [clock] = useState(() => createPlayClock(initialMs));
  const [elapsedMs, setElapsedMs] = useState(() => clock.read());
  const activeRef = useRef(active);
  activeRef.current = active;
  useEffect(() => {
    const sync = () => {
      if (active && document.visibilityState !== 'hidden') clock.start(); else clock.stop();
      setElapsedMs(clock.read());
    };
    sync();
    document.addEventListener('visibilitychange', sync);
    const id = setInterval(() => setElapsedMs(clock.read()), 1000);
    return () => { clearInterval(id); document.removeEventListener('visibilitychange', sync); clock.stop(); };
  }, [active, clock]);
  return {
    elapsedMs,
    stop: () => { const ms=clock.stop(); setElapsedMs(ms); return ms; },
    reset: () => { clock.reset(); if(activeRef.current && document.visibilityState !== 'hidden') clock.start(); setElapsedMs(0); },
    read: () => clock.read(),
  };
}
