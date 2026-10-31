import { useCallback, useEffect, useReducer, useRef, useState, type CSSProperties } from 'react';
import {
  clearSession,
  formatClock,
  GameOverlay,
  KeyHelp,
  SaveBadge,
  StatPanel,
  useArcadeRun,
  useRestoredSession,
  useRunTimer,
  useSessionAutosave,
  type ArcadeGameProps,
  type ArcadeStatus,
  type OverlayAction,
} from './arcade';
import { LookToggle } from './components/LookToggle';
import { MOVE_MS, NutBoard } from './components/NutBoard';
import { useLook } from './hooks/useLook';
import { useNutSortKeys } from './hooks/useNutSortKeys';
import { LEVEL_COUNT } from './logic/constants';
import { advanceGame, createInitialState, runScore, type GameState } from './logic/game';
import { LEVELS } from './logic/levels';
import { isNutSortSession, type SavedGame } from './logic/persist';
import { canMove } from './logic/rules';
import { maxLevelScore, restartCap } from './logic/scoring';
import styles from './App.module.css';

/** Bump when SavedGame changes shape; older saves are then discarded. */
const SESSION_SCHEMA = 1;

/** Lets the last nut land before the result card covers the board. */
export const RESULT_DELAY_MS = 600;

/** The highest possible run score (100 × Σ types). */
const RUN_MAX = LEVELS.reduce((sum, l) => sum + maxLevelScore(l.types), 0);

/**
 * UI phase layered on top of the engine's phase: `idle` before the first run
 * of a visit, `live` while a run is on (or just finished), `paused` while it is suspended.
 */
type Phase = 'idle' | 'live' | 'paused';

type Confirm = 'restart' | 'newGame' | null;

const KEYS: [string, string][] = [
  ['1–9 0', 'Select bolt 1–10 (lift / drop)'],
  ['Esc', 'Put a lifted nut back'],
  ['U Ctrl+Z', 'Undo (+1 move)'],
  ['R', 'Restart level (lowers its score)'],
  ['Enter Space', 'Start · next level'],
  ['P', 'Pause / resume'],
];

export function NutSortGame(props: ArcadeGameProps = {}) {
  const { embedded = false } = props;
  const restored = useRestoredSession<SavedGame>('nutsort', SESSION_SCHEMA, isNutSortSession);
  // A finished run is already recorded: it is never restored (and its save is discarded in idle).
  const resumable = restored !== null && restored.data.phase !== 'finished' ? restored : null;

  const [state, dispatch] = useReducer(advanceGame, undefined, (): GameState => resumable?.data ?? createInitialState());
  const [phase, setPhase] = useState<Phase>(resumable ? 'paused' : 'idle');
  const [runKey, setRunKey] = useState(0);
  const [welcomeBack, setWelcomeBack] = useState(resumable !== null);
  const [confirm, setConfirm] = useState<Confirm>(null);
  const [animating, setAnimating] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const { look, setLook } = useLook();

  const finished = state.phase === 'finished';
  const status: ArcadeStatus =
    phase === 'idle' ? 'idle' : finished ? 'gameOver' : phase === 'paused' ? 'paused' : 'running';
  const running = status === 'running';
  const score = runScore(state);
  const level = LEVELS[state.levelIndex];

  // The clock only runs while a level is being played (not on the level-complete card).
  const seconds = useRunTimer(
    running && state.phase === 'playing',
    runKey,
    runKey === 0 && resumable ? resumable.seconds : 0,
  );

  const stats = useArcadeRun({ gameId: 'nutsort', status, score, seconds, runKey, outcome: 'win', props });

  const savedAt = useSessionAutosave({
    gameId: 'nutsort',
    schema: SESSION_SCHEMA,
    enabled: phase !== 'idle' && !finished,
    discard: phase === 'idle' || finished,
    data: state,
    seconds,
    score,
  });

  // ── Move animation lock ────────────────────────────────────
  // A ref, not just state: two clicks in the same tick must not both pass.
  const lockRef = useRef(false);
  const lockTimer = useRef<number | null>(null);
  const lock = useCallback(() => {
    lockRef.current = true;
    setAnimating(true);
    if (lockTimer.current !== null) window.clearTimeout(lockTimer.current);
    lockTimer.current = window.setTimeout(() => {
      lockRef.current = false;
      lockTimer.current = null;
      setAnimating(false);
    }, MOVE_MS);
  }, []);
  useEffect(
    () => () => {
      if (lockTimer.current !== null) window.clearTimeout(lockTimer.current);
    },
    [],
  );

  const resultPending = state.phase !== 'playing';
  useEffect(() => {
    if (!resultPending) {
      setShowResult(false);
      return;
    }
    const id = window.setTimeout(() => setShowResult(true), RESULT_DELAY_MS);
    return () => window.clearTimeout(id);
  }, [resultPending, state.levelIndex, runKey]);

  // Leaving the tab pauses the run, so the clock never runs unseen.
  useEffect(() => {
    if (!running) return;
    const onVisibility = () => {
      if (document.visibilityState === 'hidden') setPhase((p) => (p === 'live' ? 'paused' : p));
    };
    document.addEventListener('visibilitychange', onVisibility);
    return () => document.removeEventListener('visibilitychange', onVisibility);
  }, [running]);

  // ── Actions ────────────────────────────────────────────────
  const interactive = running && state.phase === 'playing' && confirm === null;

  const selectBolt = useCallback(
    (bolt: number) => {
      if (!interactive || lockRef.current) return;
      const willMove = state.lifted !== null && state.lifted !== bolt && canMove(state.layout, state.lifted, bolt);
      dispatch({ type: 'select', bolt });
      if (willMove) lock();
    },
    [interactive, state.lifted, state.layout, lock],
  );

  const undo = useCallback(() => {
    if (!interactive || lockRef.current || state.history.length === 0) return;
    dispatch({ type: 'undo' });
    lock();
  }, [interactive, state.history.length, lock]);

  const cancelLift = useCallback(() => {
    if (interactive) dispatch({ type: 'cancel' });
  }, [interactive]);

  const startRun = useCallback((fresh: boolean) => {
    if (fresh) dispatch({ type: 'newRun' });
    setWelcomeBack(false);
    setConfirm(null);
    setPhase('live');
    setRunKey((k) => k + 1);
  }, []);

  // The idle state already holds a fresh run; just open it.
  const start = useCallback(() => startRun(false), [startRun]);
  const playAgain = useCallback(() => startRun(true), [startRun]);

  const togglePause = useCallback(() => {
    if (finished || phase === 'idle') return;
    setWelcomeBack(false);
    setConfirm(null);
    setPhase((p) => (p === 'live' ? 'paused' : 'live'));
  }, [finished, phase]);

  const nextLevel = useCallback(() => {
    if (state.phase === 'levelComplete' && running) dispatch({ type: 'next' });
  }, [state.phase, running]);

  const requestRestart = useCallback(() => {
    if (interactive && state.moves > 0) setConfirm('restart');
  }, [interactive, state.moves]);

  const requestNewGame = useCallback(() => {
    if (phase === 'idle') return;
    if (finished) playAgain();
    else setConfirm('newGame');
  }, [phase, finished, playAgain]);

  const confirmDialog = useCallback(() => {
    if (confirm === 'restart') dispatch({ type: 'restart' });
    // Abandoning a run never records it: the run key changes while not game-over.
    if (confirm === 'newGame') {
      startRun(true);
      return;
    }
    setConfirm(null);
  }, [confirm, startRun]);
  const dismissDialog = useCallback(() => setConfirm(null), []);

  const discardSave = useCallback(() => {
    clearSession('nutsort');
    dispatch({ type: 'newRun' });
    setWelcomeBack(false);
    setConfirm(null);
    setPhase('idle');
    setRunKey((k) => k + 1);
  }, []);

  const primary = useCallback(() => {
    if (status === 'idle') start();
    else if (status === 'paused') togglePause();
    else if (status === 'gameOver') playAgain();
    else if (state.phase === 'levelComplete') nextLevel();
  }, [status, start, togglePause, playAgain, nextLevel, state.phase]);

  useNutSortKeys({
    enabled: interactive,
    bolts: state.layout.length,
    onSelect: selectBolt,
    onUndo: undo,
    onRestart: requestRestart,
    onCancel: () => (state.lifted !== null ? cancelLift() : togglePause()),
    onPrimary: primary,
    onTogglePause: togglePause,
    dialog: confirm ? { onConfirm: confirmDialog, onDismiss: dismissDialog } : null,
  });

  // ── View ───────────────────────────────────────────────────
  const best = Math.max(stats.best, finished ? score : 0);
  const newBest = finished && score > stats.bestBeforeRun;
  const lastScore = state.levelScores[state.levelIndex] ?? 0;

  let statusLabel: string | undefined;
  if (running && state.phase === 'playing') {
    statusLabel = state.lifted !== null ? `Nut lifted from bolt ${state.lifted + 1}` : 'Pick a bolt';
  } else if (running) {
    statusLabel = 'Level solved';
  }

  let overlay: { title: string; message: string; actions: OverlayAction[] } | null = null;
  if (confirm === 'restart') {
    overlay = {
      title: 'Restart this level?',
      message: `The layout resets and this level can then pay at most ${Math.round(restartCap(state.restarts + 1) * 100)} % of its points.`,
      actions: [
        { label: 'Restart', onClick: confirmDialog, primary: true, kbd: 'Enter' },
        { label: 'Keep playing', onClick: dismissDialog, kbd: 'Esc' },
      ],
    };
  } else if (confirm === 'newGame') {
    overlay = {
      title: 'Start a new game?',
      message: 'This run ends without being recorded and you start again at level 1.',
      actions: [
        { label: 'New game', onClick: confirmDialog, primary: true, kbd: 'Enter' },
        { label: 'Keep playing', onClick: dismissDialog, kbd: 'Esc' },
      ],
    };
  } else if (status === 'idle') {
    overlay = {
      title: 'Nut Sort',
      message:
        'Sort the nuts so each bolt holds four of one kind. Every kind has its own width and notch count. Fewer moves score more; 20 levels.',
      actions: [{ label: 'Start', onClick: start, primary: true, kbd: 'Space' }],
    };
  } else if (status === 'paused') {
    overlay = welcomeBack
      ? {
          title: 'Welcome back',
          message: `Your run was restored — level ${state.levelIndex + 1} of ${LEVEL_COUNT}, ${score} points so far.`,
          actions: [
            { label: 'Continue', onClick: togglePause, primary: true, kbd: 'P' },
            { label: 'New game', onClick: playAgain },
          ],
        }
      : {
          title: 'Paused',
          message: 'Your run is autosaved — you can close the tab and continue later.',
          actions: [{ label: 'Resume', onClick: togglePause, primary: true, kbd: 'P' }],
        };
  } else if (status === 'gameOver' && showResult) {
    overlay = {
      title: `All ${LEVEL_COUNT} levels solved!`,
      message: `Final score ${score} of ${RUN_MAX} · Best ${best}${newBest ? ' — new best!' : ''}`,
      actions: [{ label: 'Play again', onClick: playAgain, primary: true, kbd: 'Enter' }],
    };
  } else if (state.phase === 'levelComplete' && showResult) {
    overlay = {
      title: `Level ${state.levelIndex + 1} solved`,
      message:
        `+${lastScore} of ${maxLevelScore(level.types)} points · par ${level.par}, ${state.moves} moves, ` +
        `${state.restarts} ${state.restarts === 1 ? 'restart' : 'restarts'} · Run ${score}`,
      actions: [{ label: 'Next level', onClick: nextLevel, primary: true, kbd: 'Enter' }],
    };
  }

  return (
    <div className={`arc-game ${styles.game}`} style={{ '--game-color': 'var(--game-nutsort)' } as CSSProperties}>
      {!embedded && (
        <header className="arc-game__head">
          <div>
            <h1 className="arc-game__title">Nut Sort</h1>
            <p className="arc-game__sub">Sort the nuts onto bolts in as few moves as you can — shaped for colour-blind players.</p>
          </div>
        </header>
      )}

      <StatPanel
        status={status}
        statusLabel={statusLabel}
        items={[
          { label: 'Level', value: `${state.levelIndex + 1}/${LEVEL_COUNT}` },
          { label: 'Moves', value: `${state.moves} / ${level.par}` },
          { label: 'Score', value: score },
          { label: 'Time', value: formatClock(seconds) },
        ]}
      />

      <div className={styles.layout}>
        <div className={`arc-game__board ${styles.boardWrap}`}>
          <NutBoard
            layout={state.layout}
            lifted={state.lifted}
            shake={state.shake}
            look={look}
            disabled={!interactive || animating}
            onSelectBolt={selectBolt}
          />
          {overlay && <GameOverlay {...overlay} />}
        </div>

        <aside className={styles.side}>
          <section className="arc-panel">
            <h2 className="arc-panel__title">Game</h2>
            <div className={styles.buttons}>
              <button
                type="button"
                className="arc-btn arc-btn--primary"
                onClick={status === 'running' || status === 'paused' ? togglePause : primary}
              >
                {status === 'running' ? 'Pause' : status === 'paused' ? 'Resume' : status === 'idle' ? 'Start' : 'Play again'}
              </button>
              <button type="button" className="arc-btn" onClick={requestNewGame} disabled={status === 'idle'}>
                New game
              </button>
            </div>
            <div className={styles.buttons}>
              <button type="button" className="arc-btn" onClick={undo} disabled={!interactive || state.history.length === 0}>
                Undo <kbd className="arc-kbd">U</kbd>
              </button>
              <button type="button" className="arc-btn" onClick={requestRestart} disabled={!interactive || state.moves === 0}>
                Restart <kbd className="arc-kbd">R</kbd>
              </button>
            </div>
            <p className={styles.note}>
              Level {state.levelIndex + 1}: par {level.par} · worth up to {Math.round(maxLevelScore(level.types) * restartCap(state.restarts))}
              {state.restarts > 0 ? ` (${state.restarts} ${state.restarts === 1 ? 'restart' : 'restarts'})` : ''}. Undo adds a move.
            </p>
            <div className={styles.save}>
              <SaveBadge savedAt={phase !== 'idle' ? savedAt : null} onDiscard={discardSave} />
            </div>
          </section>

          <section className="arc-panel">
            <h2 className="arc-panel__title">Settings</h2>
            <div className={styles.settings}>
              <LookToggle look={look} onChange={setLook} />
            </div>
          </section>

          <section className="arc-panel">
            <h2 className="arc-panel__title">Keys</h2>
            <KeyHelp rows={KEYS} />
          </section>
        </aside>
      </div>
    </div>
  );
}

export default NutSortGame;
