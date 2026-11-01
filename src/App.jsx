import { useEffect, useRef, useState } from 'react';
import { useSave, update, refreshMissions, currentLang } from './store.js';
import { useT } from './i18n.js';
import { levelCount, getLevel } from './game/levels.js';
import { stageOfLevel, indexInStage } from './game/stages.js';
import { isTutorial } from './game/tutorial.js';
import { ART } from './board/sprites.js';
import { MOCK_SERVICES } from './config.js';
import { PlatformOverlay } from './services/platform.jsx';
import Home from './screens/Home.jsx';
import StageMap from './screens/StageMap.jsx';
import Stage from './screens/Stage.jsx';
import Game from './screens/Game.jsx';
import Settings from './screens/Settings.jsx';
import Shop from './screens/Shop.jsx';
import Story from './screens/Story.jsx';
import CoinShop from './screens/CoinShop.jsx';
import Missions from './screens/Missions.jsx';
import SpinWheel from './screens/SpinWheel.jsx';
import Customize from './screens/Customize.jsx';
import AdHost from './ui/AdHost.jsx';
import StartPopup from './ui/StartPopup.jsx';
import { Icon, IconDefs, CoinChip } from './ui/icons.jsx';
import HomeScene from './ui/HomeScene.jsx';
import CloudWipe, { CLOSE_MS, OPEN_MS } from './ui/CloudWipe.jsx';

// screens that sit on the grass (top-down world) instead of the sky
const GRASS = new Set(['game']);
// the stage map has its own island-and-sea art; every other menu screen sits on the home sky scene
const SEA = new Set(['map']);
const SCENE_DECOR = new Set(['home', 'stage']);
const POPUP_CLOSE_MS = 200; // the popleave animation in styles.css
const COIN_LINK = new Set(['shop', 'missions', 'settings', 'custom']);

export default function App() {
  const save = useSave();
  const t = useT();
  // first launch: the story, then straight into level 1
  const [screen, setScreen] = useState(() => (save.storySeen ? { name: 'home' } : { name: 'story', then: 'game' }));
  const screenRef = useRef(screen);
  screenRef.current = screen;
  const stack = useRef([]);
  const gameBack = useRef(null);
  const timers = useRef([]);
  useEffect(() => () => timers.current.forEach(clearTimeout), []);
  // shop and coin popups open ON the current screen (no screen change) and close back to it
  const [overlay, setOverlay] = useState(null);
  const overlayRef = useRef(null);
  overlayRef.current = overlay;
  // the start popup of a station opens on the screen that asked for it; the game loads only after Play
  const [startLevel, setStartLevel] = useState(1);
  const startLevelRef = useRef(1);
  startLevelRef.current = startLevel;
  const askStart = (level) => {
    setStartLevel(level);
    setOverlay('start');
  };
  // popups play their closing animation before they leave; `next` opens another one right after
  const [leaving, setLeaving] = useState(false);
  const leavingRef = useRef(false);
  const closeOverlay = (next = null) => {
    if (leavingRef.current) return;
    leavingRef.current = true;
    setLeaving(true);
    timers.current.push(
      setTimeout(() => {
        leavingRef.current = false;
        setLeaving(false);
        setOverlay(next);
      }, POPUP_CLOSE_MS),
    );
  };
  const closeStart = () => {
    closeOverlay();
    // after "next" the finished level is still behind the popup
    if (screenRef.current.name === 'game') replace('stage', { stage: stageOf(startLevelRef.current) });
  };

  useEffect(() => {
    document.documentElement.lang = t.lang;
    document.documentElement.dir = t.dir;
    document.documentElement.classList.toggle('ed-fa', t.lang === 'fa');
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

  // scene transition: clouds cover the screen, the screen is switched underneath them, the clouds part again.
  // Clicks are blocked while it runs. Pager arrows of the levels screen (stage -> stage) keep their own animation.
  const [wipe, setWipe] = useState('idle');
  const busy = useRef(false);
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

  // the new language comes up under the clouds, on Home
  const changeLang = () =>
    withWipe(() => {
      update({ lang: currentLang() === 'fa' ? 'en' : 'fa' });
      setOverlay(null);
      stack.current = [];
      setScreen({ name: 'home' });
    });

  useEffect(() => {
    refreshMissions();
  }, []);

  const nextLevel = Math.min(save.unlocked, levelCount);
  const stageOf = (n) => stageOfLevel(n);

  const finishStory = () => {
    update({ storySeen: true });
    const s = screenRef.current;
    if (s.then === 'game') replace('game', { level: 1, stage: 1, picks: [] });
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
          if (overlayRef.current === 'start') closeStart();
          else if (overlayRef.current) closeOverlay();
          else if (s.name === 'home') CapApp.exitApp();
          else if (s.name === 'story') finishStory();
          else if (s.name === 'game') gameBack.current?.();
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
    <div className={'app on-' + screen.name + (overlay ? ' popup-open' : '') + (leaving ? ' popup-leaving' : '')} style={{ '--grass': `url(${ART}tiles/grass-b.png)` }}>
      <IconDefs />
      {sky && !SEA.has(screen.name) && <HomeScene decor={SCENE_DECOR.has(screen.name)} />}
      <div className="rotate-hint"><Icon name="repeat" /> {t('portraitOnly')}</div>
      {screen.name === 'home' && (
        <Home
          onPlay={() => askStart(nextLevel)}
          onMap={() => replace('map')}
          onCoins={() => setOverlay('coins')}
          onMissions={() => setOverlay('missions')}
          onShop={() => setOverlay('shop')}
          onSettings={() => setOverlay('settings')}
          onSpin={() => setOverlay('spin')}
          onCustomize={() => setOverlay('custom')}
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
          onNext={() => askStart(Math.min(levelCount, screen.level + 1))}
          onShop={() => setOverlay('shop')}
          onCoins={() => setOverlay('coins')}
          backRef={gameBack}
        />
      )}
      {screen.name === 'story' && <Story onDone={finishStory} />}
      {overlay === 'settings' && (
        <Settings
          onBack={() => closeOverlay()}
          onLang={changeLang}
          onStory={() => {
            closeOverlay();
            go('story');
          }}
        />
      )}
      {overlay === 'start' && (
        <StartPopup
          key={startLevel}
          levelNo={startLevel}
          inStage={indexInStage(startLevel)}
          stars={save.stars[startLevel] || 0}
          tutorial={isTutorial(getLevel(startLevel))}
          onPlay={(picks) => {
            closeOverlay();
            replace('game', { level: startLevel, stage: stageOf(startLevel), picks });
          }}
          onClose={closeStart}
        />
      )}
      {overlay === 'custom' && <Customize onBack={() => closeOverlay()} />}
      {overlay === 'spin' && <SpinWheel onBack={() => closeOverlay()} />}
      {overlay === 'missions' && <Missions onBack={() => closeOverlay()} />}
      {overlay === 'shop' && <Shop onBack={() => closeOverlay()} />}
      {overlay === 'coins' && <CoinShop onBack={() => closeOverlay()} />}
      {/* the balance stays in sight over the dim layer; it opens the coin shop only from popups that are safe to leave */}
      {overlay && <CoinChip className="over-coins" amount={t.n(save.coins)} onClick={COIN_LINK.has(overlay) ? () => closeOverlay('coins') : undefined} label={t('coins')} />}
      <CloudWipe phase={wipe} />
      {MOCK_SERVICES && <AdHost />}
      <PlatformOverlay />
    </div>
  );
}
