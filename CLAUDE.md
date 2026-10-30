# Nut Sort Game — CLAUDE.md

## Project Facts

* **Repository**: https://github.com/ZoliQua/Nut-Sort-Game (package `nut-sort-game`)
* **Portal**: https://github.com/ZoliQua/Arcade-Game-Center — arcade id **`nutsort`**, colour token `--game-nutsort`,
  play URL https://drdul.hu/arcade/#/play/nutsort. The same `src/` is mirrored into `Arcade-Game-Center/apps/nutsort/`.
* **Sister games**: Tetris, Snake (the reference implementation), 2048, Pac-Man, Gomoku, Tic-Tac-Toe, Breakout,
  Space Invaders, Connect Four. Connect Four is the closest template (reducer + session guard that replays history).
* **Stack**: React 18.3, Vite 5.4, TypeScript 5.6, CSS Modules on the shared arcade tokens. No other runtime dependencies.
  Offline scripts run with `vite-node` (ships with Vitest).
* **Package manager**: npm. **Node**: >=20.
* **Scripts**:
  * `npm run dev` — local dev server
  * `npm run build` — `tsc -b && vite build`
  * `npm run preview` — preview production build
  * `npm run typecheck` — `tsc -b`
  * `npm run lint` — ESLint (flat config, typescript-eslint)
  * `npm test` — Vitest (logic + component tests, jsdom)
  * `npm run check` — lint → typecheck → test → build (same as CI)
  * `npm run levels:generate` — regenerate `src/logic/levels.json` (seeded, reproducible)
  * `npm run verify:levels` — independently re-solve every level and confirm its `par` (offline, not in CI)
* **Rules**: bolts hold up to **4 nuts** (`CAPACITY`); each type has exactly 4 nuts. A move takes exactly **one** top nut
  onto an empty bolt or a same-type top with room. Solved = every non-empty bolt holds 4 nuts of one type.
* **Nut identity**: never colour alone — every type has a distinct **width** and a **notch count** (`NUT_TYPES` in
  `src/logic/constants.ts`). Width-neighbours always differ in notches; equal notch counts differ by ≥ 32/116 in width.
* **Levels**: 20 fixed levels in `src/logic/levels.json`, each with a proven minimum `par` and an optimal `solution`.
  The game never generates or solves levels at runtime.
* **Scoring** (`src/logic/scoring.ts`): `round(100 × types × min(1, par / moves) × max(0.2, 1 − 0.2 × restarts))` per level;
  undo adds +1 to the move counter; the run score is the sum, max **10 800**. A finished run is recorded once with outcome `'win'`;
  a run abandoned through "New game" is not recorded.
* **Stats**: kept by the kit (`arcade.stats.nutsort`). No game-owned high-score storage.
* **Session**: `SavedGame` = `GameState` under `arcade.session.nutsort`, schema 1, validated by `isNutSortSession`
  (replays the history from the level's start layout). A finished run is never restored.
* **Other prefs**: `nutsort.look` (`neon` default, `glass`).
* **Rendering**: SVG board. No canvas, no game loop.
* **Communication**: respond to the user in **Hungarian** in chat, even though this file and the codebase are in English.

If any fact above disagrees with the real repository, verify first and flag the divergence to the user before editing code.

---

## Primary Goal

A correct, type-safe, colour-blind-friendly Nut Sort whose every level has a verified minimum, that runs standalone and
embeds unchanged in the Arcade-Game-Center portal.

**Priority order**: correctness → truthfulness → verification → small diffs → maintainability → polish.

---

## Architecture

```
src/
  arcade/              # VENDORED shared kit from Arcade-Game-Center/packages/kit — never edit here
  logic/               # pure rules, no React
    types.ts constants.ts
    rules.ts           # canMove, applyMove, legalMoves, isSolved
    solver.ts          # canonicalKey, admissible heuristic, exact A* solve
    levels.ts          # LEVELS (levels.json, validated at import)
    scoring.ts         # restartCap, levelScore
    game.ts            # advanceGame reducer, createInitialState, runScore
    persist.ts         # isNutSortSession — strict saved-session validator
    *.test.ts
  hooks/               # useLook, useNutSortKeys
  components/          # Nut, NutBoard (+ module css), LookToggle
  demo/NutSortDemo.tsx (+ test)
  NutSortGame.tsx      # embeddable game, ArcadeGameProps; App.module.css for its layout
  App.tsx              # exactly <ArcadeShell gameId="nutsort"><NutSortGame /></ArcadeShell>
  main.tsx             # imports arcade/arcade.css once, applyTheme(readTheme())
  index.ts             # exports NutSortGame, NutSortDemo, default + types
  test/setup.ts
scripts/
  generate-levels.ts   # seeded generator → src/logic/levels.json
  verify-levels.ts     # re-solves every level without a budget, asserts par
```

Stats, session autosave/restore, timer, theme, stat strip and overlays come from `src/arcade/`
(`useArcadeRun`, `useSessionAutosave`, `useRestoredSession`, `useRunTimer`, `StatPanel`, `GameOverlay`, `SaveBadge`, `KeyHelp`).
Change the kit only in Arcade-Game-Center and sync it.

`src/logic/*` never imports from `react`, `hooks/` or `components/`.

---

## Working Rules

**Verify before and after every non-trivial change.** Read the target file and its neighbours; afterwards re-check imports, call sites and state transitions.

**No hallucination.** Never claim a build, lint or test passed without running it.

**Small, local, reversible changes.** One fix or one feature at a time.

**Preserve architecture.** Do not change Vite config, tsconfig, folder layout or styling approach without a stated reason and user approval.

**No new dependencies** without justification. No Zustand, game engines, lodash, immer, animation libraries.

**CSS**: CSS Modules + kit tokens only. No `:root`, `html`, `body`, `*` or bare element selectors in game styles. Must look right in both `[data-theme='dark']` and `[data-theme='light']`.

---

## Nut-Sort-Specific Bug Checklist

* Moves take exactly one nut; full targets, mismatched tops and empty sources are rejected.
* Every shipped level replays its `solution` to solved in exactly `par` moves; `verify:levels` re-proves par after every regeneration.
* Undo on an empty history (level start, right after a restart) is a no-op and does not touch the move counter.
* Input is ignored while a nut animates; rapid clicks never apply two moves or lose a nut.
* The session guard replays the history and rejects anything inconsistent; a finished run is never restored or recorded twice.
* Notches stay visible on a 360 px wide phone with 10 bolts; no horizontal scroll.
* Demo: no keyboard, stats or storage writes; one timeout chain; freezes when `active === false`.
* Hotkeys ignored while typing or with Cmd/Ctrl/Alt (except Ctrl/Cmd+Z for undo).

---

## Implementation Protocol (short)

1. **Current state** — only what you verified from the repo.
2. **Goal** — the exact requested change.
3. **Plan** — the smallest safe path and which files you will touch.
4. **Edit** — only the scoped change.
5. **Verify** — `npm run check`; note any checks you skipped.
6. **Report** — see below.

---

## End-of-Task Report

* **Changed files** — each file with a one-line reason.
* **Verified** — which checks actually ran.
* **Not verified** — explicit gaps.
* **Risks / follow-ups** — only real concerns, no filler.

---

**Guiding principle**: correctness over speed, verification over confidence, truth over fluency, small safe diffs over large rewrites. When in doubt — inspect more, assume less, change less, state uncertainty clearly.

---

## Git & Commit Rules

- Commit **only** as `Zoltán Dul <zoltan.dul@gmail.com>` (the global git identity).
- **Never** add `Co-Authored-By: Claude …`, "Generated with Claude Code" or any AI attribution
  to commit messages or pull-request descriptions.
- Conventional Commits (`feat:`, `fix:`, `docs:`, `test:`, `refactor:`, `chore:`).
