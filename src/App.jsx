import { useEffect, useRef, useState } from 'react';
import { useSave } from './store.js';
import { useT } from './i18n.js';
import { levelCount } from './game/levels.js';
import Home from './screens/Home.jsx';
import LevelSelect from './screens/LevelSelect.jsx';
import Game from './screens/Game.jsx';
import Settings from './screens/Settings.jsx';

function Clouds() {
  return (
    <div className="sky" aria-hidden="true">
      <i className="cloud c1" />
      <i className="cloud c2" />
      <i className="cloud c3" />
      <div className="hills" />
    </div>
  );
}

export default function App() {
  const save = useSave();
  const t = useT();
  const [screen, setScreen] = useState({ name: 'home', level: 1 });
  const screenRef = useRef(screen);
  screenRef.current = screen;

  useEffect(() => {
    document.documentElement.lang = t.lang;
    document.documentElement.dir = t.dir;
    document.documentElement.classList.add('ed-' + t.lang);
    document.title = t('title');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [t.lang, t.dir]);

  // portrait only (the manifest already locks it; this covers other runtimes)
  useEffect(() => {
    try {
      screen.orientation?.lock?.('portrait')?.catch(() => {});
    } catch (e) {
      /* not supported */
    }
  }, []);

  // Android back button
  useEffect(() => {
    let handle;
    (async () => {
      try {
        const { Capacitor } = await import('@capacitor/core');
        if (!Capacitor.isNativePlatform()) return;
        const { App: CapApp } = await import('@capacitor/app');
        handle = await CapApp.addListener('backButton', () => {
          const s = screenRef.current.name;
          if (s === 'game') setScreen({ name: 'levels' });
          else if (s === 'levels' || s === 'settings') setScreen({ name: 'home' });
          else CapApp.exitApp();
        });
      } catch (e) {
        /* web build */
      }
    })();
    return () => handle?.remove();
  }, []);

  const go = (name, level) => setScreen({ name, level: level ?? screenRef.current.level });
  const nextUnlocked = Math.min(save.unlocked, levelCount);

  return (
    <div className="app">
      <Clouds />
      <div className="rotate-hint">↻ {t('portraitOnly')}</div>
      {screen.name === 'home' && (
        <Home
          onPlay={() => go('game', nextUnlocked)}
          onLevels={() => go('levels')}
          onSettings={() => go('settings')}
          hasProgress={save.unlocked > 1}
        />
      )}
      {screen.name === 'levels' && <LevelSelect onBack={() => go('home')} onPick={(n) => go('game', n)} />}
      {screen.name === 'settings' && <Settings onBack={() => go('home')} />}
      {screen.name === 'game' && (
        <Game
          key={screen.level}
          levelNo={screen.level}
          onLevels={() => go('levels')}
          onNext={() => go('game', Math.min(levelCount, screen.level + 1))}
        />
      )}
    </div>
  );
}
