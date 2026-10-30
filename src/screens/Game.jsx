import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Board from '../three/Board.jsx';
import { Stars } from './LevelSelect.jsx';
import { useSave, completeLevel, spendHint } from '../store.js';
import { useT } from '../i18n.js';
import { getLevel, levelCount, DIFFICULTY_KEYS } from '../game/levels.js';
import { startPath, evaluate, applyHint } from '../game/logic.js';
import { isTutorial, coachFor, tutorialIdleMs } from '../game/tutorial.js';
import { sfx } from '../audio.js';
import { TUTORIAL_LEVELS } from '../config.js';

export default function Game({ levelNo, onLevels, onNext }) {
  const level = useMemo(() => getLevel(levelNo), [levelNo]);
  const save = useSave();
  const t = useT();
  const [path, setPath] = useState(() => startPath(level));
  const [phase, setPhase] = useState('play'); // play | run | won
  const [hintsUsed, setHintsUsed] = useState(0);
  const [toast, setToast] = useState('');
  const [stars, setStars] = useState(3);
  const pathRef = useRef(path);
  const tutorial = isTutorial(level);
  const [idle, setIdle] = useState(false);
  const toastTimer = useRef();

  const result = useMemo(() => evaluate(level, path), [level, path]);

  // tutorial coach: after a moment without a move the finger shows what to do next
  useEffect(() => {
    if (!tutorial || phase !== 'play') return undefined;
    setIdle(false);
    const timer = setTimeout(() => setIdle(true), tutorialIdleMs(level));
    return () => clearTimeout(timer);
  }, [tutorial, phase, path, level]);
  const coach = useMemo(
    () => (tutorial && phase === 'play' ? coachFor(level, path, idle) : null),
    [tutorial, phase, level, path, idle],
  );

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

  const onPath = useCallback(
    (next) => {
      const prev = pathRef.current;
      pathRef.current = next;
      setPath(next);
      if (next.length > prev.length) sfx.lay(next.length);
      else sfx.undo();
    },
    [],
  );

  // solved -> train runs
  useEffect(() => {
    if (phase === 'play' && result.solved) {
      setStars(tutorial || hintsUsed === 0 ? 3 : hintsUsed === 1 ? 2 : 1);
      setPhase('run');
      sfx.whistle();
    }
  }, [result.solved, phase, hintsUsed, tutorial]);

  // reached the exit but numbers do not match
  useEffect(() => {
    // (the tutorial coach already explains what went wrong)
    if (phase === 'play' && !tutorial && result.reachedExit && !result.solved) {
      sfx.error();
      say(t('countsOff'));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [result.reachedExit, result.solved]);

  const onRunDone = useCallback(() => {
    setPhase('won');
    sfx.win();
    completeLevel(levelNo, stars);
  }, [levelNo, stars]);

  const undo = () => {
    if (phase !== 'play' || path.length <= 1) return;
    sfx.undo();
    commit(path.slice(0, -1));
  };
  const restart = () => {
    if (phase !== 'play') return;
    sfx.click();
    commit(startPath(level));
  };
  const hint = () => {
    if (phase !== 'play') return;
    if (!tutorial && save.hints <= 0) {
      sfx.error();
      say(t('noHints'));
      return;
    }
    sfx.hint();
    if (!tutorial) {
      // hints are free while learning
      spendHint();
      setHintsUsed((n) => n + 1);
    }
    commit(applyHint(level, path));
  };

  const lastLevel = levelNo >= levelCount;

  return (
    <main className="screen game">
      <header className="topbar">
        <button className="icon-btn" onClick={onLevels} aria-label={t('back')}>
          <svg viewBox="0 0 24 24" width="26" height="26">
            <path d="M15 5l-7 7 7 7" />
          </svg>
        </button>
        <div className="title-block">
          <h2>
            {t('level')} {t.n(levelNo)}
          </h2>
          <span className={'diff d' + level.difficulty}>{t(DIFFICULTY_KEYS[level.difficulty])}</span>
        </div>
        <span className="chip hint-chip">💡 {t.n(save.hints)}</span>
      </header>

      <div className="board-wrap">
        <Board
          level={level}
          path={path}
          pathRef={pathRef}
          evalResult={result}
          phase={phase}
          coach={coach}
          onPath={onPath}
          onRunDone={onRunDone}
        />
        {coach && <div className="bubble" key={coach.text}>{t(coach.text)}</div>}
        {toast && <div className="toast">{toast}</div>}
      </div>

      <footer className="controls">
        <button className="ctl" onClick={undo} disabled={phase !== 'play' || path.length <= 1}>
          <svg viewBox="0 0 24 24" width="26" height="26">
            <path d="M9 7L4 12l5 5M4 12h10a6 6 0 010 12" transform="translate(0 -4)" />
          </svg>
          <span>{t('undo')}</span>
        </button>
        <button className="ctl accent" onClick={hint} disabled={phase !== 'play'}>
          <svg viewBox="0 0 24 24" width="26" height="26">
            <path d="M9 18h6M10 21h4M12 3a6 6 0 00-3.5 10.9c.6.5 1 1.2 1 2.1h5c0-.9.4-1.6 1-2.1A6 6 0 0012 3z" />
          </svg>
          <span>{t('hint')}</span>
        </button>
        <button className="ctl" onClick={restart} disabled={phase !== 'play'}>
          <svg viewBox="0 0 24 24" width="26" height="26">
            <path d="M4 12a8 8 0 108-8M4 4v5h5" />
          </svg>
          <span>{t('restart')}</span>
        </button>
      </footer>

      {phase === 'won' && (
        <div className="modal-back">
          <div className="modal win">
            <h3>{t('won')}</h3>
            <Stars n={stars} size={46} />
            {lastLevel && <p className="small">{t('allDone')}</p>}
            {tutorial && levelNo === TUTORIAL_LEVELS && <p className="small">{t('tutDone')}</p>}
            <div className="modal-actions col">
              {!lastLevel && (
                <button className="btn big yellow" onClick={onNext}>
                  {t('next')}
                </button>
              )}
              <button
                className="btn"
                onClick={() => {
                  setPhase('play');
                  setHintsUsed(0);
                  commit(startPath(level));
                }}
              >
                {t('replay')}
              </button>
              <button className="btn" onClick={onLevels}>
                {t('levels')}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
