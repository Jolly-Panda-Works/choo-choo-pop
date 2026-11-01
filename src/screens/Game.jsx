import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import BoardCanvas from '../board/BoardCanvas.jsx';
import { loadSprites } from '../board/sprites.js';
import Panda from '../ui/Panda.jsx';
import { ua } from '../anim/ua.js';
import Modal from '../ui/Modal.jsx';
import { Stars, Coin, Bulb, BackButton, PowerIcon } from '../ui/icons.jsx';
import StartPopup from '../ui/StartPopup.jsx';
import { useSave, completeLevel, spendHint, addHints, tickAdCounter, spendPowerup, trackMission } from '../store.js';
import { useT } from '../i18n.js';
import { getLevel, levelCount, DIFFICULTY_KEYS, nodeKind } from '../game/levels.js';
import { stageOfLevel, indexInStage, STAGES } from '../game/stages.js';
import { startPaths, evaluate, applyHint, eraseWrong } from '../game/logic.js';
import { isTutorial, coachFor, tutorialIdleMs } from '../game/tutorial.js';
import { sfx } from '../audio.js';
import { ads } from '../services/ads.js';
import { TUTORIAL_LEVELS, COIN_BASE, COINS_PER_STAR, STAGE_SIZE, POWERUPS, POWERUP_STAGE, PEEK_MS } from '../config.js';

export default function Game({ levelNo, startPicks, onMap, onNext, onShop, onCoins }) {
  const baseLevel = useMemo(() => getLevel(levelNo), [levelNo]);
  const [bonusGiven, setBonusGiven] = useState([]); // gold stars laid by the star power-up
  const level = useMemo(() => (bonusGiven.length ? { ...baseLevel, given: [...baseLevel.given, ...bonusGiven] } : baseLevel), [baseLevel, bonusGiven]);
  const save = useSave();
  const t = useT();
  const [ready, setReady] = useState(false);
  const [paths, setPaths] = useState(() => startPaths(baseLevel));
  const [powerUsed, setPowerUsed] = useState(0);
  const [peekUntil, setPeekUntil] = useState(0);
  const [noPower, setNoPower] = useState(null);
  // intro (start popup) | play | run | won | lost
  // (opened from the start popup of the levels screen: that popup was already answered, so the level starts right away)
  const [phase, setPhase] = useState(startPicks ? 'play' : 'intro');
  const [hintsUsed, setHintsUsed] = useState(0);
  const [mistakes, setMistakes] = useState(0);
  const [toast, setToast] = useState('');
  const [stars, setStars] = useState(3);
  const [reward, setReward] = useState({ coins: 0 });
  const [noHints, setNoHints] = useState(false);
  const [idle, setIdle] = useState(false);
  const pathRef = useRef(paths);
  const toastTimer = useRef();
  const adDue = useRef(false);
  const tutorial = isTutorial(level);
  const stage = stageOfLevel(levelNo);
  const kind = nodeKind(level.difficulty);

  useEffect(() => {
    loadSprites().then(() => setReady(true));
  }, []);

  const result = useMemo(() => evaluate(level, paths), [level, paths]);
  const path = paths[0];
  const playing = phase === 'play';

  // tutorial coach: after a moment without a move the finger shows what to do next
  useEffect(() => {
    if (!tutorial || !playing) return undefined;
    setIdle(false);
    const timer = setTimeout(() => setIdle(true), tutorialIdleMs(level));
    return () => clearTimeout(timer);
  }, [tutorial, playing, paths, level]);
  const coach = useMemo(() => (tutorial && playing ? coachFor(level, paths[0], idle) : null), [tutorial, playing, level, paths, idle]);

  const say = useCallback((msg) => {
    setToast(msg);
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(''), 2200);
  }, []);
  useEffect(() => () => clearTimeout(toastTimer.current), []);

  const commit = useCallback((next) => {
    pathRef.current = next;
    setPaths(next);
  }, []);

  const onPath = useCallback((next) => {
    const prev = pathRef.current;
    pathRef.current = next;
    setPaths(next);
    const n = next.flat().length;
    if (n > prev.flat().length) sfx.lay(n);
    else sfx.undo();
  }, []);

  // solved -> train runs
  useEffect(() => {
    if (playing && result.solved) {
      const penalty = hintsUsed + mistakes + powerUsed;
      setStars(tutorial || penalty === 0 ? 3 : penalty <= 2 ? 2 : 1);
      setPhase('run');
      sfx.whistle();
    }
  }, [result.solved, playing, hintsUsed, mistakes, powerUsed, tutorial]);

  // every train reached its exit but the numbers do not match: a mistake (no lives - it only costs a star)
  useEffect(() => {
    if (playing && !tutorial && result.reachedExit && !result.solved) {
      sfx.error();
      setMistakes((m) => m + 1);
      say(t('countsOff'));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [result.reachedExit, result.solved]);

  const onRunDone = useCallback(() => {
    setPhase('won');
    sfx.win();
    const res = completeLevel(levelNo, stars, level.difficulty);
    setReward(res);
    adDue.current = tickAdCounter(levelNo);
    if (levelNo > TUTORIAL_LEVELS) {
      trackMission('win');
      trackMission('stars', stars);
      if (stars === 3) trackMission('perfect');
      if (hintsUsed === 0) trackMission('nohint');
      if (mistakes === 0) trackMission('nomistake');
      trackMission('coins', res.coins);
    }
  }, [levelNo, stars, level.difficulty, hintsUsed, mistakes]);

  const undo = () => {
    if (!playing) return;
    // take back the last rail laid (the longest lane that has more than its entry tile)
    const li = paths.reduce((best, p, i) => (p.length > 1 && (best === -1 || p.length >= paths[best].length) ? i : best), -1);
    if (li === -1) return;
    sfx.undo();
    commit(paths.map((p, i) => (i === li ? p.slice(0, -1) : p)));
  };
  const restart = () => {
    if (!playing) return;
    sfx.click();
    commit(startPaths(baseLevel));
  };
  const hint = () => {
    if (!playing) return;
    if (!tutorial && save.hints <= 0) {
      sfx.error();
      setNoHints(true);
      return;
    }
    sfx.hint();
    if (!tutorial) {
      spendHint(); // hints are free while learning
      setHintsUsed((n) => n + 1);
    }
    commit(applyHint(level, paths));
  };

  // ---- power-ups (stage 2 and later)
  const usePower = (id, free = false) => {
    if (!playing) return false;
    const cur = pathRef.current;
    if (id === 'eraser' && eraseWrong(level, cur).every((p, i) => p.length === cur[i].length)) {
      say(t('nothingWrong'));
      return false;
    }
    if (id === 'star') {
      const skip = new Set([...level.given, ...level.lanes.flatMap((l) => [l.solution[0], l.solution[l.solution.length - 1]])]);
      const pool = level.allSolution.filter((c) => !skip.has(c));
      if (!pool.length) {
        say(t('nothingWrong'));
        return false;
      }
      if (!free && !spendPowerup(id)) return setNoPower(id), false;
      setBonusGiven((b) => [...b, pool[Math.floor(Math.random() * pool.length)]]);
    } else {
      if (!free && !spendPowerup(id)) return setNoPower(id), false;
      if (id === 'eraser') commit(eraseWrong(level, cur));
      else setPeekUntil(performance.now() + PEEK_MS);
    }
    sfx.hint();
    setPowerUsed((n) => n + 1);
    trackMission('powerup');
    return true;
  };

  const begin = (picks = []) => {
    sfx.click();
    setPhase('play');
    // boosters chosen in the start popup: spend one of each and apply it right away
    setTimeout(() => {
      for (const id of picks) {
        if (id === 'hint') {
          if (save.hints > 0) {
            spendHint();
            setHintsUsed((n) => n + 1);
            commit(applyHint(level, pathRef.current));
          }
        } else {
          pendingPick.current = [...(pendingPick.current || []), id];
        }
      }
      setPickTick((n) => n + 1);
    }, 0);
  };
  const pendingPick = useRef([]);
  const [pickTick, setPickTick] = useState(0);
  useEffect(() => {
    if (!playing || !pendingPick.current.length) return;
    const list = pendingPick.current;
    pendingPick.current = [];
    list.forEach((id) => usePower(id));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pickTick, playing]);

  // start popup was shown on the levels screen: apply its boosters and begin
  const startedRef = useRef(false);
  useEffect(() => {
    if (!startPicks || startedRef.current) return;
    startedRef.current = true;
    begin(startPicks);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const watchForHint = async () => {
    const ok = await ads.rewarded();
    setNoHints(false);
    if (ok) {
      addHints(1);
      say(t('gotHint'));
    }
  };

  // an ad may follow a finished level (skippable); never blocks the game
  const leave = async (fn) => {
    sfx.click();
    if (adDue.current) {
      adDue.current = false;
      await ads.interstitial();
    }
    fn();
  };

  const lastLevel = levelNo >= levelCount;
  const inStage = indexInStage(levelNo);
  const maxCoins = COIN_BASE[level.difficulty] + COINS_PER_STAR * 3;
  const stageDone = inStage === STAGE_SIZE;

  if (!ready) return <main className="screen game" />;

  return (
    <main className="screen game">
      <header className="topbar">
        <BackButton onClick={onMap} label={t('back')} />
        <div className="title-block">
          <h2>
            {t('station')} {t.n(inStage)}
          </h2>
          <span className="sub-row">
            <span className={'diff k-' + kind}>{t(DIFFICULTY_KEYS[level.difficulty])}</span>
          </span>
        </div>
        <button className="chip coin-chip" onClick={onCoins} aria-label={t('coins')}>
          <Coin size={22} /> {t.n(save.coins)} <b className="plus">+</b>
        </button>
      </header>

      <div className="board-wrap">
        <BoardCanvas
          level={level}
          paths={paths}
          pathRef={pathRef}
          peekUntil={peekUntil}
          evalResult={result}
          phase={phase === 'play' || phase === 'run' || phase === 'won' ? phase : 'locked'}
          coach={coach}
          skin={save.trainSkin}
          reserveBottom={tutorial ? 104 : 0}
          onPath={onPath}
          onRunDone={onRunDone}
        />
        {coach && (
          <div className="bubble panda-bubble" key={coach.text}>
            <Panda pose={coach.ghost?.kind === 'back' ? 'lever' : 'point'} skin={save.pandaSkin} size={92} />
            <span>{t(coach.text)}</span>
          </div>
        )}
        {toast && <div className="toast">{toast}</div>}
      </div>

      {stage >= POWERUP_STAGE && (
        <div className="powers">
          {POWERUPS.map((p) => (
            <button key={p.id} className="power" onClick={() => usePower(p.id)} disabled={!playing} aria-label={t('pw_' + p.id)}>
              <PowerIcon id={p.id} size={34} />
              <span>{t('pw_' + p.id)}</span>
              <i className="badge">{t.n(save.powerups[p.id] || 0)}</i>
            </button>
          ))}
        </div>
      )}
      <footer className="controls">
        <button className="ctl" onClick={undo} disabled={!playing || paths.every((p) => p.length <= 1)}>
          <svg viewBox="0 0 24 24" width="26" height="26">
            <path d="M9 7L4 12l5 5M4 12h10a6 6 0 010 12" transform="translate(0 -4)" />
          </svg>
          <span>{t('undo')}</span>
        </button>
        <button className="ctl accent" onClick={hint} disabled={!playing}>
          <Bulb />
          <span>{t('hint')}</span>
          {!tutorial && <i className="badge">{t.n(save.hints)}</i>}
        </button>
        <button className="ctl" onClick={restart} disabled={!playing}>
          <svg viewBox="0 0 24 24" width="26" height="26">
            <path d="M4 12a8 8 0 108-8M4 4v5h5" />
          </svg>
          <span>{t('restart')}</span>
        </button>
      </footer>

      {/* ---- start of level ---- */}
      {phase === 'intro' && (
        <StartPopup level={level} levelNo={levelNo} inStage={inStage} stars={save.stars[levelNo] || 0} maxCoins={maxCoins} tutorial={tutorial} onPlay={begin} onClose={onMap} onCoins={onCoins} />
      )}

      {/* ---- level cleared ---- */}
      {phase === 'won' && (
        <Modal pose="cheer" title={t(stageDone ? 'stageDone' : 'won')}>
          <Stars n={stars} size={58} className="big win-stars" pop />
          <p className="reward-line big">
            {reward.coins > 0 ? (
              <>
                <Coin size={26} /> +{t.n(reward.coins)}
              </>
            ) : (
              <span className="small">{t('noNewCoins')}</span>
            )}
          </p>
          {reward.hintBonus && <p className="small">{t('bonusHint')}</p>}
          {lastLevel && <p className="small">{t('allDone')}</p>}
          {tutorial && levelNo === TUTORIAL_LEVELS && <p className="small">{t('tutDone')}</p>}
          <div className="modal-actions col">
            {!lastLevel && (
              <button className="btn big yellow" onClick={() => leave(onNext)}>
                {t('next')}
              </button>
            )}
            {lastLevel && (
              <button className="btn big yellow" onClick={() => leave(onMap)}>
                {t('backToMap')}
              </button>
            )}
            <div className="modal-actions">
              <button
                className="btn"
                onClick={() =>
                  leave(() => {
                    setHintsUsed(0);
                    setMistakes(0);
                    commit(startPaths(baseLevel));
                    setBonusGiven([]);
                    setPowerUsed(0);
                    setPhase('play');
                  })
                }
              >
                {t('replay')}
              </button>
              {!lastLevel && (
                <button className="btn" onClick={() => leave(onMap)}>
                  {t('map')}
                </button>
              )}
            </div>
          </div>
        </Modal>
      )}

      {/* ---- no power-up left ---- */}
      {noPower && (
        <Modal pose="lever" title={t('noPowerTitle')} onClose={() => setNoPower(null)}>
          <p className="goal">{t('noPower')}</p>
          <div className="modal-actions col">
            <button className="btn big blue" onClick={onShop}>
              {t('shop')}
            </button>
            <button className="btn" onClick={() => setNoPower(null)}>
              {t('cancel')}
            </button>
          </div>
        </Modal>
      )}

      {/* ---- no hints left ---- */}
      {noHints && (
        <Modal pose="lever" title={t('noHintsTitle')} onClose={() => setNoHints(false)}>
          <p className="goal">{t('noHints')}</p>
          <div className="modal-actions col">
            {ads.rewardedAvailable() && (
              <button className="btn big yellow" onClick={watchForHint}>
                ▶ {t('watchForHint')}
              </button>
            )}
            <button className="btn big blue" onClick={onShop}>
              {t('shop')}
            </button>
            <button className="btn" onClick={() => setNoHints(false)}>
              {t('cancel')}
            </button>
          </div>
        </Modal>
      )}
    </main>
  );
}
