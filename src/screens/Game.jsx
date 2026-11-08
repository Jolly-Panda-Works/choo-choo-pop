import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import BoardCanvas from '../board/BoardCanvas.jsx';
import { loadSprites, loadLook, holdSprites, UI_ART } from '../board/sprites.js';
import Panda from '../ui/Panda.jsx';
import { ua } from '../anim/ua.js';
import Modal from '../ui/Modal.jsx';
import { Stars, Coin, CoinChip, Bulb, BackButton, Icon, PowerIcon } from '../ui/icons.jsx';
import { useSave, completeLevel, spendHint, addHints, tickAdCounter, spendPowerup, trackMission, saveDraft, clearDraft } from '../store.js';
import { useT } from '../i18n.js';
import { getLevel, levelCount, DIFFICULTY_KEYS, nodeKind } from '../game/levels.js';
import { stageOfLevel, indexInStage, STAGES } from '../game/stages.js';
import { startPaths, evaluate, applyHint, peekSegment } from '../game/logic.js';
import { boardSignature, freshBoard, restoreDraft, pushBoard, undoBoard, redoBoard } from '../game/boardState.js';
import { timeTargets, timedStars, formatTime } from '../game/timing.js';
import { usePlayTimer } from '../game/usePlayTimer.js';
import { isTutorial, coachFor, tutorialIdleMs, idleCoach } from '../game/tutorial.js';
import { sfx } from '../audio.js';
import { ads } from '../services/ads.js';
import { TUTORIAL_LEVELS, STAGE_SIZE, POWERUPS, powerAvailable, PEEK_MS, IDLE_HINT_MS } from '../config.js';

export default function Game({ levelNo, startPicks = [], onMap, onNext, onShop, onCoins, backRef }) {
  const baseLevel = useMemo(() => getLevel(levelNo), [levelNo]);
  const level = baseLevel;
  const save = useSave();
  const t = useT();
  const [ready, setReady] = useState(false);
  const restored = useRef(restoreDraft(level, save.drafts?.[levelNo]));
  const [history, setHistory] = useState(() => restored.current || { past: [], present: freshBoard(level), future: [] });
  const historyRef = useRef(history);
  const paths = history.present.paths;
  const notes = history.present.notes;
  const [noteMode, setNoteMode] = useState(false);
  const [lessonOpen, setLessonOpen] = useState(!!level.lesson);
  const [powerUsed, setPowerUsed] = useState(() => restored.current?.powerUsed || 0);
  const [peekUntil, setPeekUntil] = useState(0);
  const [peekTrail, setPeekTrail] = useState(null);
  const [noPower, setNoPower] = useState(null);
  // play | run | won | lost | next (the start popup of the next station is up)
  // (opened from the start popup of the levels screen: that popup was already answered, so the level starts right away)
  const [phase, setPhase] = useState('play');
  const [hintsUsed, setHintsUsed] = useState(() => restored.current?.hintsUsed || 0);
  const [mistakes, setMistakes] = useState(() => restored.current?.mistakes || 0);
  const [toast, setToast] = useState('');
  const [stars, setStars] = useState(3);
  const [reward, setReward] = useState({ coins: 0 });
  const [noHints, setNoHints] = useState(false);
  const [askLeave, setAskLeave] = useState(false);
  const [idle, setIdle] = useState(false);
  const pathRef = useRef(paths);
  const toastTimer = useRef();
  const adDue = useRef(false);
  const tutorial = isTutorial(level);
  const stage = stageOfLevel(levelNo);
  const kind = nodeKind(level.difficulty);

  useEffect(() => {
    const release = holdSprites();
    Promise.all([loadSprites(), loadLook('train', save.trainSkin), loadLook('rail', save.railSkin)]).then(() => setReady(true));
    return release;
  }, []);

  const result = useMemo(() => evaluate(level, paths), [level, paths]);
  const path = paths[0];
  const playing = phase === 'play';
  const targets = useMemo(() => timeTargets(level), [level]);
  const timer = usePlayTimer(ready && playing && !lessonOpen && !askLeave && !noHints && !noPower, restored.current?.elapsedMs);
  const liveStars = timedStars(timer.elapsedMs, targets);

  // after a moment without a move the finger shows what to do next (the tutorial coach, or the idle hint of a station)
  useEffect(() => {
    if (!playing) return undefined;
    setIdle(false);
    const timer = setTimeout(() => setIdle(true), tutorial ? tutorialIdleMs(level) : IDLE_HINT_MS);
    return () => clearTimeout(timer);
  }, [tutorial, playing, paths, level]);
  const coach = useMemo(() => (tutorial && playing ? coachFor(level, paths[0], idle) : null), [tutorial, playing, level, paths, idle]);
  const idleHint = useMemo(() => (!tutorial && playing && idle ? idleCoach(level, paths) : null), [tutorial, playing, idle, level, paths]);

  const say = useCallback((msg) => {
    setToast(msg);
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(''), 2200);
  }, []);
  useEffect(() => () => clearTimeout(toastTimer.current), []);

  const install = useCallback(h => {
    historyRef.current = h;
    pathRef.current = h.present.paths;
    setHistory(h);
  }, []);
  const commit = useCallback((next, nextNotes = historyRef.current.present.notes) => {
    install(pushBoard(historyRef.current, { paths: next, notes: nextNotes }));
  }, [install]);
  useEffect(() => {
    if (phase === 'won' || phase === 'next') { clearDraft(levelNo); return; }
    saveDraft(levelNo, { ...history, signature: boardSignature(level), hintsUsed, mistakes, powerUsed, elapsedMs: timer.elapsedMs });
  }, [history, hintsUsed, mistakes, powerUsed, phase, levelNo, level, timer.elapsedMs]);
  // Flush the final fraction of a second on navigation or app suspension.
  const draftRef = useRef(null);
  draftRef.current = { history, hintsUsed, mistakes, powerUsed, phase, read: timer.read };
  useEffect(() => {
    const flush = () => {
      const d = draftRef.current;
      if (d.phase === 'won' || d.phase === 'next') return;
      saveDraft(levelNo, { ...d.history, signature: boardSignature(level), hintsUsed: d.hintsUsed, mistakes: d.mistakes, powerUsed: d.powerUsed, elapsedMs: d.read() });
    };
    window.addEventListener('pagehide', flush);
    return () => { window.removeEventListener('pagehide', flush); flush(); };
  }, [levelNo, level]);
  const onNote = cell => {
    if (!playing || level.blockSet.has(cell) || paths.flat().includes(cell) || level.fixed.some(f => f.cell === cell)) return;
    const next = {...notes};
    const value = ((next[cell] || 0) + 1) % 3;
    if (value) next[cell] = value; else delete next[cell];
    commit(pathRef.current, next);
  };
  const onPath = useCallback(next => {
    const prev = historyRef.current.present.paths;
    commit(next);
    if (next.flat().length > prev.flat().length) sfx.lay(next.flat().length); else sfx.undo();
  }, [commit]);

  // solved -> train runs
  useEffect(() => {
    if (playing && result.solved) {
      setStars(timedStars(timer.stop(), targets));
      setPhase('run');
      sfx.whistle();
    }
  }, [result.solved, playing, targets]);

  // every train reached its exit but the numbers do not match: a mistake (feedback only; stars depend on active solving time)
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
    if (stageDone) sfx.levelUp();
    else sfx.win();
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
    sfx.undo();
    install(undoBoard(historyRef.current));
  };
  const redo = () => { if (playing) { sfx.click(); install(redoBoard(historyRef.current)); } };
  const restart = () => {
    if (!playing) return;
    sfx.click();
    install({ past: [], present: freshBoard(level), future: [] });
    timer.reset();
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

  // ---- power-ups (lands 4-6)
  const usePower = (id, free = false) => {
    if (!playing || !powerAvailable(id, levelNo, save.taught)) return false;
    const trail = peekSegment(level, pathRef.current);
    if (!trail || peekUntil > performance.now()) return false;
    if (!free && !spendPowerup(id)) return setNoPower(id), false;
    setPeekTrail(trail);
    setPeekUntil(performance.now() + PEEK_MS);
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

  // the start popup was shown on the screen before this one: apply its boosters and begin
  const startedRef = useRef(false);
  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;
    begin(restored.current ? [] : startPicks);
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

  // leaving a level in play asks first; the Android back button comes here too
  const goBack = () => {
    if (playing) setAskLeave(true);
    else onMap();
  };
  if (backRef) backRef.current = goBack;

  const lastLevel = levelNo >= levelCount;
  const inStage = indexInStage(levelNo);
  const stageDone = inStage === STAGE_SIZE;
  const taughtPowers = POWERUPS.filter((p) => powerAvailable(p.id, levelNo, save.taught));

  if (!ready) return <main className="screen game" />;

  return (
    <main className="screen game">
      <header className="topbar">
        <BackButton onClick={goBack} label={t('back')} />
        <div className="title-block">
          <h2>
            {t('station')} {t.n(inStage)}
          </h2>
          <span className="sub-row">
            <span className={'diff k-' + kind}>{t(DIFFICULTY_KEYS[level.difficulty])}</span>
          </span>
        </div>
        <CoinChip amount={t.n(save.coins)} onClick={onCoins} label={t('coins')} />
      </header>

      <div className="solve-timer" aria-label={t('solveTime')}>
        <div className="timer-current"><span>{t('solveTime')}</span> <b dir="ltr">{t.n(formatTime(timer.elapsedMs))}</b><Stars n={playing ? liveStars : stars} size={20} /></div>
        <div className="timer-targets">{t('timeTargets', { three: t.n(formatTime(targets.threeMs)), two: t.n(formatTime(targets.twoMs)) })}</div>
      </div>
      <div className="board-wrap">
        <BoardCanvas
          level={level}
          paths={paths}
          notes={notes}
          noteMode={noteMode}
          onNote={onNote}
          pathRef={pathRef}
          peekUntil={peekUntil}
          peekTrail={peekTrail}
          evalResult={result}
          phase={phase === 'play' || phase === 'run' || phase === 'won' ? phase : 'locked'}
          coach={noteMode ? null : coach || idleHint}
          skin={save.trainSkin}
          railSkin={save.railSkin}
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

      {taughtPowers.length > 0 && (
        <div className="powers">
          {taughtPowers.map((p) => (
            <button key={p.id} className="power" onClick={() => usePower(p.id)} disabled={!playing} aria-label={t('pw_' + p.id)}>
              <PowerIcon id={p.id} size={28} />
              <span>{t('pw_' + p.id)}</span>
              <i className="badge">{t.n(save.powerups[p.id] || 0)}</i>
            </button>
          ))}
        </div>
      )}
      <footer className="controls">
        <button className="ctl" onClick={undo} disabled={!playing || !history.past.length}>
          <img src={`${UI_ART}undo.png`} width="30" height="30" alt="" draggable="false" />
          <span>{t('undo')}</span>
        </button>
        <button className="ctl" onClick={redo} disabled={!playing || !history.future.length}><span aria-hidden="true">↪</span><span>{t('redo')}</span></button>
        <button className="ctl" onClick={() => { setNoteMode(v => !v); if (!noteMode) say(t('notesHelp')); }} disabled={!playing} aria-pressed={noteMode}><span aria-hidden="true">● ×</span><span>{t(noteMode ? 'drawRails' : 'notes')}</span></button>
        <button className="ctl" onClick={hint} disabled={!playing}>
          <Bulb size={30} />
          <span>{t('hint')}</span>
          {!tutorial && <i className="badge">{t.n(save.hints)}</i>}
        </button>
        <button className="ctl" onClick={restart} disabled={!playing}>
          <img src={`${UI_ART}restart.png`} width="30" height="30" alt="" draggable="false" />
          <span>{t('restart')}</span>
        </button>
      </footer>

      {lessonOpen && <Modal pose="point" title={t('newRule')}><p className="goal">{t(level.lesson)}</p><button className="btn big green" onClick={() => setLessonOpen(false)}>{t('gotIt')}</button></Modal>}
      {/* ---- level cleared ---- */}
      {phase === 'won' && (
        <Modal pose="cheer" title={t(stageDone ? 'stageDone' : 'won')}>
          <Stars n={stars} size={58} className="big win-stars" pop />
          <p className="small">{t('solveTime')}: <b dir="ltr">{t.n(formatTime(timer.elapsedMs))}</b></p>
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
              <button
                className="btn big yellow"
                onClick={() =>
                  leave(() => {
                    setPhase('next');
                    onNext();
                  })
                }
              >
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
                    timer.reset();
                    setHintsUsed(0);
                    setMistakes(0);
                    install({ past: [], present: freshBoard(level), future: [] });
                    setPeekTrail(null);
                    setPeekUntil(0);
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

      {/* ---- leave the level? ---- */}
      {askLeave && (
        <Modal pose="lever" title={t('leaveTitle')} onClose={() => setAskLeave(false)}>
          {(leave) => (
            <>
              <p className="goal">{t('leaveText')}</p>
              <div className="modal-actions col">
                <button className="btn big green one-line" onClick={() => (sfx.click(), leave(() => setAskLeave(false)))}>
                  {t('stayHere')}
                </button>
                <button className="btn red" onClick={() => (sfx.click(), onMap())}>
                  {t('leaveLevel')}
                </button>
              </div>
            </>
          )}
        </Modal>
      )}

      {/* ---- no power-up left ---- */}
      {noPower && (
        <Modal pose="lever" title={t('noPowerTitle')} onClose={() => setNoPower(null)}>
          <p className="goal">{t('noPower')}</p>
          <div className="modal-actions col">
            <button className="btn big green" onClick={onShop}>
              {t('shop')}
            </button>
            <button className="btn red" onClick={() => setNoPower(null)}>
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
                <Icon name="play" /> {t('watchForHint')}
              </button>
            )}
            <button className="btn big green" onClick={onShop}>
              {t('shop')}
            </button>
            <button className="btn red" onClick={() => setNoHints(false)}>
              {t('cancel')}
            </button>
          </div>
        </Modal>
      )}
    </main>
  );
}
