import { useEffect, useRef, useState } from 'react';
import { useSave, update, refreshMissions } from './store.js';
import { useT } from './i18n.js';
import { levelCount } from './game/levels.js';
import { stageOfLevel } from './game/stages.js';
import { loadSprites, ART } from './board/sprites.js';
import { MOCK_SERVICES } from './config.js';
import { putOffBazaarUpdate, updateFromBazaar, useBazaarUpdate } from './services/bazaarApp.js';
import Home from './screens/Home.jsx';
import StageMap from './screens/StageMap.jsx';
import Stage from './screens/Stage.jsx';
import Game from './screens/Game.jsx';
import Settings from './screens/Settings.jsx';
import Shop from './screens/Shop.jsx';
import Story from './screens/Story.jsx';
import CoinShop from './screens/CoinShop.jsx';
import Missions from './screens/Missions.jsx';
import AdHost from './ui/AdHost.jsx';
import Modal from './ui/Modal.jsx';
import { IconDefs } from './ui/icons.jsx';
import HomeScene from './ui/HomeScene.jsx';
import CloudWipe, { CLOSE_MS, OPEN_MS } from './ui/CloudWipe.jsx';

// screens that sit on the grass (top-down world) instead of the sky
const GRASS = new Set(['game']);
// the stage map has its own island-and-sea art; every other menu screen sits on the home sky scene
const SEA = new Set(['map']);
const SCENE_DECOR = new Set(['home', 'stage']);

export default function App() {
  const save = useSave();
  const t = useT();
  const [bazaarUpdate, closeBazaarUpdate] = useBazaarUpdate();
  // first launch: the story, then straight into level 1
  const [screen, setScreen] = useState(() => (save.storySeen ? { name: 'home' } : { name: 'story', then: 'game' }));
  const screenRef = useRef(screen);
  screenRef.current = screen;
  const stack = useRef([]);
  // shop and coin popups open ON the current screen (no screen change) and close back to it
  const [overlay, setOverlay] = useState(null);
  const overlayRef = useRef(null);
  overlayRef.current = overlay;

  useEffect(() => {
    document.documentElement.lang = t.lang;
    document.documentElement.dir = t.dir;
    document.documentElement.classList.toggle('ed-fa', t.lang === 'fa');
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

  // scene transition: clouds cover the screen, the screen is switched underneath them, the clouds part again.
  // Clicks are blocked while it runs. Pager arrows of the levels screen (stage -> stage) keep their own animation.
  const [wipe, setWipe] = useState('idle');
  const busy = useRef(false);
  const timers = useRef([]);
  useEffect(() => () => timers.current.forEach(clearTimeout), []);
  const withWipe = (change, instant = false) => {
    if (busy.current) return;
    if (instant) return change();
    busy.current = true;
    setWipe('in');
    timers.current.push(
      setTimeout(() => {
        change();
        setWipe('out');
        timers.current.push(
          setTimeout(() => {
            setWipe('idle');
            busy.current = false;
          }, OPEN_MS),
        );
      }, CLOSE_MS),
    );
  };

  const go = (name, extra = {}) =>
    withWipe(() => {
      stack.current.push(screenRef.current);
      setScreen({ name, ...extra });
    });
  const replace = (name, extra = {}) =>
    withWipe(
      () => {
        stack.current = [];
        setScreen({ name, ...extra });
      },
      name === 'stage' && screenRef.current.name === 'stage',
    );
  const back = (fallback) =>
    withWipe(() => {
      const prev = stack.current.pop();
      setScreen(prev || fallback);
    });

  useEffect(() => {
    refreshMissions();
  }, []);

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
          if (overlayRef.current) setOverlay(null);
          else if (s.name === 'home') CapApp.exitApp();
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

  const sky = !GRASS.has(screen.name) && screen.name !== 'home';
  return (
    <div className={'app on-' + screen.name} style={{ '--grass': `url(${ART}tiles/grass-b.png)` }}>
      <IconDefs />
      {sky && !SEA.has(screen.name) && <HomeScene decor={SCENE_DECOR.has(screen.name)} />}
      <div className="rotate-hint">↻ {t('portraitOnly')}</div>
      {screen.name === 'home' && (
        <Home
          onPlay={() => replace('game', { level: nextLevel, stage: stageOf(nextLevel) })}
          onMap={() => replace('map')}
          onCoins={() => setOverlay('coins')}
          onMissions={() => go('missions')}
          onShop={() => setOverlay('shop')}
          onSettings={() => go('settings')}
        />
      )}
      {screen.name === 'map' && (
        <StageMap onBack={() => replace('home')} onOpen={(id) => replace('stage', { stage: id })} onCoins={() => setOverlay('coins')} />
      )}
      {screen.name === 'stage' && (
        <Stage
          stageId={screen.stage}
          onBack={() => replace('map')}
          onStage={(id) => replace('stage', { stage: id })}
          onPick={(n, picks) => replace('game', { level: n, stage: screen.stage, picks })}
          onCoins={() => setOverlay('coins')}
        />
      )}
      {screen.name === 'game' && (
        <Game
          key={screen.level}
          levelNo={screen.level}
          startPicks={screen.picks}
          onMap={() => replace('stage', { stage: stageOf(screen.level) })}
          onNext={() => replace('game', { level: Math.min(levelCount, screen.level + 1) })}
          onShop={() => setOverlay('shop')}
          onCoins={() => setOverlay('coins')}
        />
      )}
      {screen.name === 'missions' && <Missions onBack={() => back({ name: 'home' })} />}
      {screen.name === 'settings' && <Settings onBack={() => back({ name: 'home' })} onStory={() => go('story')} />}
      {screen.name === 'story' && <Story onDone={finishStory} />}
      {overlay === 'shop' && <Shop onBack={() => setOverlay(null)} onCoins={() => setOverlay('coins')} />}
      {overlay === 'coins' && <CoinShop onBack={() => setOverlay(null)} />}
      <CloudWipe phase={wipe} />
      {MOCK_SERVICES && <AdHost />}
      {bazaarUpdate && (
        <Modal
          pose="salute"
          title={t('updateTitle')}
          onClose={() => {
            putOffBazaarUpdate(bazaarUpdate);
            closeBazaarUpdate();
          }}
        >
          <p className="small">{t('updateBody')}</p>
          <div className="modal-actions">
            <button
              className="btn"
              onClick={() => {
                putOffBazaarUpdate(bazaarUpdate);
                closeBazaarUpdate();
              }}
            >
              {t('updateLater')}
            </button>
            <button
              className="btn"
              onClick={() => {
                updateFromBazaar();
                closeBazaarUpdate();
              }}
            >
              {t('updateNow')}
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
