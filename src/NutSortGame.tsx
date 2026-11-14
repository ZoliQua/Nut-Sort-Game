import { useCallback, useEffect, useReducer, useRef, useState, type CSSProperties } from 'react';
import {
  clearSession,
  FinishButton,
  formatClock,
  formatNumber,
  FullscreenButton,
  gameName,
  GameOverlay,
  KeyHelp,
  RulesButton,
  SaveBadge,
  StatPanel,
  TouchHelp,
  useImmersive,
  useArcadeRun,
  useRestoredSession,
  useRunTimer,
  useKitMessages,
  useLang,
  useMessages,
  useSessionAutosave,
  type ArcadeGameProps,
  type ArcadeStatus,
  type OverlayAction,
} from './arcade';
import { DentalToggle } from './components/DentalToggle';
import { LookToggle } from './components/LookToggle';
import { MOVE_MS, NutBoard } from './components/NutBoard';
import { useLook } from './hooks/useLook';
import { useNutSortKeys } from './hooks/useNutSortKeys';
import { LEVEL_COUNT } from './logic/constants';
import { advanceGame, createInitialState, RUN_MAX_SCORE, runScore, type GameState } from './logic/game';
import { LEVELS } from './logic/levels';
import { isNutSortSession, type SavedGame } from './logic/persist';
import { canMove } from './logic/rules';
import { maxLevelScore, restartCap } from './logic/scoring';
import { useRulesSections } from './rules';
import { MESSAGES, type MessageKey } from './i18n';
import styles from './App.module.css';

/** Bump when SavedGame changes shape; older saves are then discarded. */
const SESSION_SCHEMA = 1;

/** Lets the last nut land before the result card covers the board. */
export const RESULT_DELAY_MS = 600;


/**
 * UI phase layered on top of the engine's phase: `idle` before the first run
 * of a visit, `live` while a run is on (or just finished), `paused` while it is suspended.
 */
type Phase = 'idle' | 'live' | 'paused';

type Confirm = 'restart' | 'newGame' | null;

const KEYS: [string, MessageKey][] = [
  ['1–9 0', 'keySelect'],
  ['Esc', 'keyPutBack'],
  ['U Ctrl+Z', 'keyUndo'],
  ['R', 'keyRestart'],
  ['Enter Space', 'keyStart'],
  ['P', 'keyPause'],
];

export function NutSortGame(props: ArcadeGameProps = {}) {
  const { embedded = false } = props;
  const t = useMessages(MESSAGES);
  const k = useKitMessages();
  const [lang] = useLang();
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
  const rootRef = useRef<HTMLDivElement>(null);
  const immersive = useImmersive(rootRef);
  const rulesSections = useRulesSections();
  // The Finish confirm is open: the clock and the board stand still without leaving `running`.
  const [finishOpen, setFinishOpen] = useState(false);

  const finished = state.phase === 'finished';
  const status: ArcadeStatus =
    phase === 'idle' ? 'idle' : finished ? 'gameOver' : phase === 'paused' ? 'paused' : 'running';
  const running = status === 'running';
  const score = runScore(state);
  const level = LEVELS[state.levelIndex];

  // The clock only runs while a level is being played (not on the level-complete card).
  const seconds = useRunTimer(
    running && state.phase === 'playing' && !finishOpen,
    runKey,
    runKey === 0 && resumable ? resumable.seconds : 0,
  );

  const stats = useArcadeRun({ gameId: 'nutsort', status, score, seconds, runKey, outcome: () => (state.finishedEarly ? 'finished' : 'win'), props });

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
  const interactive = running && state.phase === 'playing' && confirm === null && !finishOpen;

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

  // Opening the rules pauses a live run; closing them leaves it paused.
  const rulesOpenChange = useCallback((open: boolean) => {
    if (!open) return;
    setConfirm(null);
    setPhase((p) => (p === 'live' ? 'paused' : p));
  }, []);

  const finishEarly = useCallback(() => {
    setWelcomeBack(false);
    setConfirm(null);
    dispatch({ type: 'finishEarly' });
  }, []);

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
  const num = (n: number) => formatNumber(n, lang);
  const restartsText = t(state.restarts === 1 ? 'restartsOne' : 'restartsMany', { n: state.restarts });
  const keyRows = KEYS.map(([keys, action]): [string, string] => [keys, t(action)]);

  let statusLabel: string | undefined;
  if (running && state.phase === 'playing') {
    statusLabel = state.lifted !== null ? t('liftedFrom', { n: state.lifted + 1 }) : t('pickBolt');
  } else if (running) {
    statusLabel = t('levelSolvedStatus');
  }

  let overlay: { title: string; message: string; actions: OverlayAction[] } | null = null;
  if (confirm === 'restart') {
    overlay = {
      title: t('restartTitle'),
      message: t('restartBody', { pct: Math.round(restartCap(state.restarts + 1) * 100) }),
      actions: [
        { label: t('restartConfirm'), onClick: confirmDialog, primary: true, kbd: 'Enter' },
        { label: t('keepPlaying'), onClick: dismissDialog, kbd: 'Esc' },
      ],
    };
  } else if (confirm === 'newGame') {
    overlay = {
      title: t('newGameTitle'),
      message: t('newGameBody'),
      actions: [
        { label: t('newGame'), onClick: confirmDialog, primary: true, kbd: 'Enter' },
        { label: t('keepPlaying'), onClick: dismissDialog, kbd: 'Esc' },
      ],
    };
  } else if (status === 'idle') {
    overlay = {
      title: gameName('nutsort', lang),
      message: t('idleBody'),
      actions: [{ label: k('start'), onClick: start, primary: true, kbd: 'Space' }],
    };
  } else if (status === 'paused') {
    overlay = welcomeBack
      ? {
          title: k('welcomeBack'),
          message: t('welcomeBody', { level: state.levelIndex + 1, count: LEVEL_COUNT, score: num(score) }),
          actions: [
            { label: t('continue'), onClick: togglePause, primary: true, kbd: 'P' },
            { label: t('newGame'), onClick: playAgain },
          ],
        }
      : {
          title: k('paused'),
          message: t('pausedBody'),
          actions: [{ label: k('resume'), onClick: togglePause, primary: true, kbd: 'P' }],
        };
  } else if (status === 'gameOver' && (showResult || state.finishedEarly)) {
    overlay = {
      title: state.finishedEarly ? k('finishedEarly') : t('allSolvedTitle', { count: LEVEL_COUNT }),
      message: t('finalScore', { score: num(score), max: num(RUN_MAX_SCORE), best: num(best) }) + (newBest ? t('newBestSuffix') : ''),
      actions: [{ label: t('playAgain'), onClick: playAgain, primary: true, kbd: 'Enter' }],
    };
  } else if (state.phase === 'levelComplete' && showResult) {
    overlay = {
      title: t('levelSolvedTitle', { n: state.levelIndex + 1 }),
      message: t('levelSolvedBody', {
        gained: num(lastScore),
        max: num(maxLevelScore(level.types)),
        par: level.par,
        moves: state.moves,
        restarts: restartsText,
        score: num(score),
      }),
      actions: [{ label: t('nextLevel'), onClick: nextLevel, primary: true, kbd: 'Enter' }],
    };
  }

  return (
    <div ref={rootRef} className={`arc-game ${styles.game}`} style={{ '--game-color': 'var(--game-nutsort)' } as CSSProperties}>
      {!embedded && (
        <header className="arc-game__head">
          <div>
            <h1 className="arc-game__title">{gameName('nutsort', lang)}</h1>
            <p className="arc-game__sub">{t('subtitle')}</p>
          </div>
        </header>
      )}

      <StatPanel
        status={status}
        statusLabel={statusLabel}
        items={[
          { label: k('level'), value: `${state.levelIndex + 1}/${LEVEL_COUNT}` },
          { label: k('moves'), value: `${state.moves} / ${level.par}` },
          { label: k('score'), value: num(score) },
          { label: k('time'), value: formatClock(seconds) },
        ]}
      />

      <div className={styles.layout}>
        <div className={`arc-game__board arc-board-tap ${styles.boardWrap}`}>
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
            <h2 className="arc-panel__title">{t('panelGame')}</h2>
            <div className={styles.buttons}>
              <button
                type="button"
                className="arc-btn arc-btn--primary"
                onClick={status === 'running' || status === 'paused' ? togglePause : primary}
              >
                {status === 'running'
                  ? k('pause')
                  : status === 'paused'
                    ? k('resume')
                    : status === 'idle'
                      ? k('start')
                      : t('playAgain')}
              </button>
              <button type="button" className="arc-btn" onClick={requestNewGame} disabled={status === 'idle'}>
                {t('newGame')}
              </button>
            </div>
            <div className={styles.buttons}>
              <button type="button" className="arc-btn" onClick={undo} disabled={!interactive || state.history.length === 0}>
                {t('undo')} <kbd className="arc-kbd">U</kbd>
              </button>
              <button type="button" className="arc-btn" onClick={requestRestart} disabled={!interactive || state.moves === 0}>
                {t('restart')} <kbd className="arc-kbd">R</kbd>
              </button>
            </div>
            <div className={styles.tools}>
              <RulesButton sections={rulesSections} gameId="nutsort" onOpenChange={rulesOpenChange} hotkey={false} />
              <FinishButton score={score} visible={phase !== 'idle' && !finished} onFinish={finishEarly} onOpenChange={setFinishOpen} />
              <FullscreenButton immersive={immersive} />
            </div>
            <p className={styles.note}>
              {t('levelNote', {
                n: state.levelIndex + 1,
                par: level.par,
                worth: num(Math.round(maxLevelScore(level.types) * restartCap(state.restarts))),
              })}
              {state.restarts > 0 ? t('levelNoteRestarts', { restarts: restartsText }) : ''}
              {t('undoNote')}
            </p>
            <div className={styles.save}>
              <SaveBadge savedAt={phase !== 'idle' ? savedAt : null} onDiscard={discardSave} />
            </div>
          </section>

          <section className="arc-panel">
            <h2 className="arc-panel__title">{t('panelSettings')}</h2>
            <div className={styles.settings}>
              <LookToggle look={look} onChange={setLook} />
              <DentalToggle className={styles.dentalRow} />
            </div>
          </section>

          <section className="arc-panel">
            <h2 className="arc-panel__title">{t('panelKeys')}</h2>
            <KeyHelp rows={keyRows} />
            <TouchHelp
              rows={[
                [t('touchLift'), t('touchLiftAction')],
                [t('touchDrop'), t('touchDropAction')],
                [t('touchBack'), t('touchBackAction')],
              ]}
            />
          </section>
        </aside>
      </div>
    </div>
  );
}

export default NutSortGame;
