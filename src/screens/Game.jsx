import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import BoardCanvas from '../board/BoardCanvas.jsx';
import { loadSprites } from '../board/sprites.js';
import Panda from '../ui/Panda.jsx';
import Modal from '../ui/Modal.jsx';
import { Stars, Heart, Coin, Bulb, BackIcon } from '../ui/icons.jsx';
import { useSave, completeLevel, spendHint, addHints, tickAdCounter } from '../store.js';
import { useT } from '../i18n.js';
import { getLevel, levelCount, DIFFICULTY_KEYS, nodeKind } from '../game/levels.js';
import { stageOfLevel, indexInStage, STAGES } from '../game/stages.js';
import { startPath, evaluate, applyHint } from '../game/logic.js';
import { isTutorial, coachFor, tutorialIdleMs } from '../game/tutorial.js';
import { sfx } from '../audio.js';
import { ads } from '../services/ads.js';
import { TUTORIAL_LEVELS, MAX_MISTAKES, COIN_BASE, COINS_PER_STAR, STAGE_SIZE } from '../config.js';

export default function Game({ levelNo, onMap, onNext, onShop }) {
  const level = useMemo(() => getLevel(levelNo), [levelNo]);
  const save = useSave();
  const t = useT();
  const [ready, setReady] = useState(false);
  const [path, setPath] = useState(() => startPath(level));
  // intro (start popup) | play | run | won | lost
  const [phase, setPhase] = useState('intro');
  const [hintsUsed, setHintsUsed] = useState(0);
  const [mistakes, setMistakes] = useState(0);
  const [toast, setToast] = useState('');
  const [stars, setStars] = useState(3);
  const [reward, setReward] = useState({ coins: 0 });
  const [noHints, setNoHints] = useState(false);
  const [idle, setIdle] = useState(false);
  const pathRef = useRef(path);
  const toastTimer = useRef();
  const adDue = useRef(false);
  const tutorial = isTutorial(level);
  const stage = stageOfLevel(levelNo);
  const kind = nodeKind(level.difficulty);

  useEffect(() => {
    loadSprites().then(() => setReady(true));
  }, []);

  const result = useMemo(() => evaluate(level, path), [level, path]);
  const playing = phase === 'play';

  // tutorial coach: after a moment without a move the finger shows what to do next
  useEffect(() => {
    if (!tutorial || !playing) return undefined;
    setIdle(false);
    const timer = setTimeout(() => setIdle(true), tutorialIdleMs(level));
    return () => clearTimeout(timer);
  }, [tutorial, playing, path, level]);
  const coach = useMemo(() => (tutorial && playing ? coachFor(level, path, idle) : null), [tutorial, playing, level, path, idle]);

  const say = useCallback((msg) => {
    setToast(msg);
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(''), 2200);
  }, []);
  useEffect(() => () => clearTimeout(toastTimer.current), []);

  const commit = useCallback((next) => {
    pathRef.current = next;
    setPath(next);
  }, []);

  const onPath = useCallback((next) => {
    const prev = pathRef.current;
    pathRef.current = next;
    setPath(next);
    if (next.length > prev.length) sfx.lay(next.length);
    else sfx.undo();
  }, []);

  // solved -> train runs
  useEffect(() => {
    if (playing && result.solved) {
      const penalty = hintsUsed + mistakes;
      setStars(tutorial || penalty === 0 ? 3 : penalty <= 2 ? 2 : 1);
      setPhase('run');
      sfx.whistle();
    }
  }, [result.solved, playing, hintsUsed, mistakes, tutorial]);

  // reached the exit but the numbers do not match: the station check fails (a heart is lost)
  useEffect(() => {
    if (playing && !tutorial && result.reachedExit && !result.solved) {
      sfx.error();
      const m = mistakes + 1;
      setMistakes(m);
      if (m >= MAX_MISTAKES) {
        setTimeout(() => setPhase('lost'), 650);
        setPhase('checking');
      } else say(t('countsOff'));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [result.reachedExit, result.solved]);

  const onRunDone = useCallback(() => {
    setPhase('won');
    sfx.win();
    const res = completeLevel(levelNo, stars, level.difficulty);
    setReward(res);
    adDue.current = tickAdCounter(levelNo);
  }, [levelNo, stars, level.difficulty]);

  const undo = () => {
    if (!playing || path.length <= 1) return;
    sfx.undo();
    commit(path.slice(0, -1));
  };
  const restart = () => {
    if (!playing) return;
    sfx.click();
    commit(startPath(level));
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
    commit(applyHint(level, path));
  };

  const watchForHint = async () => {
    const ok = await ads.rewarded();
    setNoHints(false);
    if (ok) {
      addHints(1);
      say(t('gotHint'));
    }
  };

  const retry = () => {
    sfx.click();
    setHintsUsed(0);
    setMistakes(0);
    commit(startPath(level));
    setPhase('play');
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
        <button className="icon-btn" onClick={onMap} aria-label={t('back')}>
          <BackIcon />
        </button>
        <div className="title-block">
          <h2>
            {t('station')} {t.n(inStage)}
          </h2>
          <span className="sub-row">
            <span className={'diff k-' + kind}>{t(DIFFICULTY_KEYS[level.difficulty])}</span>
            {!tutorial && (
              <span className="hearts" aria-label="lives">
                {Array.from({ length: MAX_MISTAKES }, (_, i) => (
                  <Heart key={i} on={i >= mistakes} size={18} />
                ))}
              </span>
            )}
          </span>
        </div>
        <button className="chip coin-chip" onClick={onShop} aria-label={t('shop')}>
          <Coin size={20} /> {t.n(save.coins)}
        </button>
      </header>

      <div className="board-wrap">
        <BoardCanvas
          level={level}
          path={path}
          pathRef={pathRef}
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
            <Panda pose={coach.ghost?.kind === 'back' ? 'lever' : 'point'} skin={save.pandaSkin} size={58} />
            <span>{t(coach.text)}</span>
          </div>
        )}
        {toast && <div className="toast">{toast}</div>}
      </div>

      <footer className="controls">
        <button className="ctl" onClick={undo} disabled={!playing || path.length <= 1}>
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
        <Modal pose="point" title={`${t('station')} ${t.n(inStage)}`}>
          <p className="small stage-line">
            {t(STAGES[stage - 1].nameKey)} · <span className={'diff k-' + kind}>{t(DIFFICULTY_KEYS[level.difficulty])}</span>
          </p>
          <p className="goal">{t(tutorial ? 'goalLearn' : kind === 'super' ? 'goalSuper' : 'goalPlay')}</p>
          {!tutorial && (
            <p className="small reward-line">
              <Coin size={18} /> {t('upTo', { n: t.n(maxCoins) })}
            </p>
          )}
          <div className="modal-actions col">
            <button
              className="btn big yellow"
              onClick={() => {
                sfx.click();
                setPhase('play');
              }}
            >
              {t('letsGo')}
            </button>
            <button className="btn" onClick={onMap}>
              {t('back')}
            </button>
          </div>
        </Modal>
      )}

      {/* ---- level cleared ---- */}
      {phase === 'won' && (
        <Modal pose="cheer" title={t(stageDone ? 'stageDone' : 'won')}>
          <Stars n={stars} size={50} className="big win-stars" />
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
                    commit(startPath(level));
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

      {/* ---- the station check failed three times ---- */}
      {phase === 'lost' && (
        <Modal pose="salute" title={t('lostTitle')}>
          <p className="goal">{t('lostText')}</p>
          <div className="modal-actions col">
            <button className="btn big yellow" onClick={retry}>
              {t('tryAgain')}
            </button>
            <button className="btn" onClick={onMap}>
              {t('map')}
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
