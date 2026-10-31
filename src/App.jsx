import { useEffect, useRef, useState } from 'react';
import { useSave, update } from './store.js';
import { useT } from './i18n.js';
import { levelCount } from './game/levels.js';
import { stageOfLevel } from './game/stages.js';
import { loadSprites, ART } from './board/sprites.js';
import { MOCK_SERVICES } from './config.js';
import Home from './screens/Home.jsx';
import StageMap from './screens/StageMap.jsx';
import Stage from './screens/Stage.jsx';
import Game from './screens/Game.jsx';
import Settings from './screens/Settings.jsx';
import Shop from './screens/Shop.jsx';
import Story from './screens/Story.jsx';
import AdHost from './ui/AdHost.jsx';
import { IconDefs } from './ui/icons.jsx';
import HomeScene from './ui/HomeScene.jsx';

// screens that sit on the grass (top-down world) instead of the sky
const GRASS = new Set(['game']);
// the stage map has its own island-and-sea art; every other menu screen sits on the home sky scene
const SEA = new Set(['map']);
const SCENE_DECOR = new Set(['home', 'stage']);

export default function App() {
  const save = useSave();
  const t = useT();
  // first launch: the story, then straight into level 1
  const [screen, setScreen] = useState(() => (save.storySeen ? { name: 'home' } : { name: 'story', then: 'game' }));
  const screenRef = useRef(screen);
  screenRef.current = screen;
  const stack = useRef([]);

  useEffect(() => {
    document.documentElement.lang = t.lang;
    document.documentElement.dir = t.dir;
    document.documentElement.classList.add('ed-' + t.lang);
    document.title = t('title');
    loadSprites().catch(() => {});
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

  const go = (name, extra = {}) => {
    stack.current.push(screenRef.current);
    setScreen({ name, ...extra });
  };
  const replace = (name, extra = {}) => {
    stack.current = [];
    setScreen({ name, ...extra });
  };
  const back = (fallback) => {
    const prev = stack.current.pop();
    setScreen(prev || fallback);
  };

  const nextLevel = Math.min(save.unlocked, levelCount);
  const stageOf = (n) => stageOfLevel(n);

  const finishStory = () => {
    update({ storySeen: true });
    const s = screenRef.current;
    if (s.then === 'game') replace('game', { level: 1, stage: 1 });
    else back({ name: 'home' });
  };

  // Android back button
  useEffect(() => {
    let handle;
    (async () => {
      try {
        const { Capacitor } = await import('@capacitor/core');
        if (!Capacitor.isNativePlatform()) return;
        const { App: CapApp } = await import('@capacitor/app');
        handle = await CapApp.addListener('backButton', () => {
          const s = screenRef.current;
          if (s.name === 'home') CapApp.exitApp();
          else if (s.name === 'story') finishStory();
          else if (s.name === 'game') replace('stage', { stage: stageOf(s.level) });
          else if (s.name === 'stage') replace('map');
          else if (s.name === 'map') replace('home');
          else back({ name: 'home' });
        });
      } catch (e) {
        /* web build */
      }
    })();
    return () => handle?.remove();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const sky = !GRASS.has(screen.name);
  return (
    <div className={'app on-' + screen.name} style={{ '--grass': `url(${ART}tiles/grass-b.png)` }}>
      <IconDefs />
      {sky && !SEA.has(screen.name) && <HomeScene decor={SCENE_DECOR.has(screen.name)} />}
      <div className="rotate-hint">↻ {t('portraitOnly')}</div>
      {screen.name === 'home' && (
        <Home
          hasProgress={save.unlocked > 1}
          onPlay={() => replace('game', { level: nextLevel, stage: stageOf(nextLevel) })}
          onMap={() => replace('map')}
          onShop={() => go('shop')}
          onSettings={() => go('settings')}
        />
      )}
      {screen.name === 'map' && (
        <StageMap onBack={() => replace('home')} onOpen={(id) => replace('stage', { stage: id })} onShop={() => go('shop')} />
      )}
      {screen.name === 'stage' && (
        <Stage
          stageId={screen.stage}
          onBack={() => replace('map')}
          onStage={(id) => replace('stage', { stage: id })}
          onPick={(n) => replace('game', { level: n, stage: screen.stage })}
          onShop={() => go('shop')}
        />
      )}
      {screen.name === 'game' && (
        <Game
          key={screen.level}
          levelNo={screen.level}
          onMap={() => replace('stage', { stage: stageOf(screen.level) })}
          onNext={() => replace('game', { level: Math.min(levelCount, screen.level + 1) })}
          onShop={() => go('shop')}
        />
      )}
      {screen.name === 'shop' && <Shop onBack={() => back({ name: 'home' })} />}
      {screen.name === 'settings' && <Settings onBack={() => back({ name: 'home' })} onStory={() => go('story')} />}
      {screen.name === 'story' && <Story onDone={finishStory} />}
      {MOCK_SERVICES && <AdHost />}
    </div>
  );
}
