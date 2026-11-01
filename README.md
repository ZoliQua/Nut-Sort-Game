# 🔩 Nut Sort

A type-safe Nut Sort puzzle built with **React 18**, **Vite** and **TypeScript** — sort coloured nuts onto bolts in as few moves
as you can. Every nut kind is told apart by its **width and the notches on its top edge**, so the game is fully playable
without colour. **20 fixed levels**, the same for every player, each with a **proven minimum (par)** found by an exact A\* solver.
Runs on its own **and** as one of the ten games of **[Zoltan's Arcade](https://github.com/ZoliQua/Arcade-Game-Center)** —
play it at [drdul.hu/arcade/#/play/nutsort](https://drdul.hu/arcade/#/play/nutsort).

[![CI](https://github.com/ZoliQua/Nut-Sort-Game/actions/workflows/ci.yml/badge.svg)](https://github.com/ZoliQua/Nut-Sort-Game/actions/workflows/ci.yml)
![license](https://img.shields.io/badge/license-MIT-green)
![node](https://img.shields.io/badge/node-%E2%89%A520-339933?logo=node.js&logoColor=white)
![react](https://img.shields.io/badge/React-18-61dafb?logo=react&logoColor=white)
![vite](https://img.shields.io/badge/Vite-5-646cff?logo=vite&logoColor=white)
![typescript](https://img.shields.io/badge/TypeScript-5-3178c6?logo=typescript&logoColor=white)

---

## 📑 Table of contents

- [The Zoltan's Arcade family](#%EF%B8%8F-the-zoltans-arcade-family)
- [Features](#-features)
- [Quick start](#-quick-start)
- [Rules](#-rules)
- [Telling nuts apart](#-telling-nuts-apart)
- [Controls](#%EF%B8%8F-controls)
- [Scoring & stats](#-scoring--stats)
- [Levels](#-levels)
- [Autosave & resume](#-autosave--resume)
- [Embedding in Arcade-Game-Center](#-embedding-in-arcade-game-center)
- [Scripts](#-scripts)
- [Architecture](#%EF%B8%8F-architecture)
- [Contributing](#-contributing)
- [License](#%EF%B8%8F-license)

## 🕹️ The Zoltan's Arcade family

Every game is a standalone repo that also plugs into the portal. They share one design system, one scoring model and one save format through the vendored [`src/arcade/`](./src/arcade) kit.

| Game | Repo | Genre |
| --- | --- | --- |
| 🏠 **Arcade portal** | [Arcade-Game-Center](https://github.com/ZoliQua/Arcade-Game-Center) | All games in one place, live demos, stats, leaderboard |
| 🧱 Tetris | [Tetris-Game](https://github.com/ZoliQua/Tetris-Game) | Arcade |
| 🐍 Snake | [Snake-Game](https://github.com/ZoliQua/Snake-Game) | Reflex |
| 🔢 2048 | [2048-Game](https://github.com/ZoliQua/2048-Game) | Puzzle |
| 🟡 Pac-Man | [Pac-Man-Game](https://github.com/ZoliQua/Pac-Man-Game) | Maze |
| ⚫ Gomoku | [Gomoku-Game](https://github.com/ZoliQua/Gomoku-Game) | Strategy |
| 🦷 Tic-Tac-Toe | [Tic-Tac-Toe-Game](https://github.com/ZoliQua/Tic-Tac-Toe-Game) | Duel |
| 🏓 Breakout | [Breakout-Game](https://github.com/ZoliQua/Breakout-Game) | Paddle |
| 👾 Space Invaders | [Space-Invaders-Game](https://github.com/ZoliQua/Space-Invaders-Game) | Shooter |
| 🔴 Connect Four | [Connect-Four-Game](https://github.com/ZoliQua/Connect-Four-Game) | Duel |
| 🔩 **Nut Sort** (this repo) | [Nut-Sort-Game](https://github.com/ZoliQua/Nut-Sort-Game) | Sorting |

## ✨ Features

- 🔩 **Nut sorting on threaded bolts** — lift a nut, drop it on a matching nut or an empty bolt; the nut glides there in ~250 ms
- 👁️ **Shaped for colour-blind players** — eight nut kinds, each with its own width **and** notch count; colour is only a bonus
- 🧩 **20 fixed levels** from 2 kinds on 3 bolts to 8 kinds on 10 bolts — identical for everyone, so scores compare
- 📐 **Proven par** — every level ships with its exact minimum number of moves and one optimal solution
- ↩️ **Undo** (costs a move) and **Restart** (costs points, asks first)
- 🏆 **Unified arcade scoring** — a finished run is recorded once; Best, plays and wins are shared with the portal
- 🎨 **Two looks** — *Neon* (default, glowing outlines on the arcade panel) and *Glass* (glossy nuts, steel bolts, wooden table)
- ⏸️ **Pause** (P, or automatically when the tab is hidden) — freezes the board and the timer
- 💾 **Autosave & resume** — the whole run survives reloads and tab closes
- 🌗 **Dark / light theme** shared with every arcade game (press **T**)
- 🤖 **Attract-mode demo** (`<NutSortDemo />`) — replays the optimal solutions of levels 1–5
- 📱 **Phone-friendly** — 7–10 bolts split into two rows, so a 360 px screen has no horizontal scroll and the notches stay visible
- ⌨️ **Keyboard-first and accessible** — every bolt is a focusable button labelled with its contents
  (`Bolt 3: 2 nuts, top type 6 (yellow, 3 notches)`)
- 🧪 **Tested** — rules, shape coding, the solver against a brute-force BFS, every level's solution, scoring, the reducer,
  the save validator, the board, the demo and component behaviour

## 🚀 Quick start

Requires **Node ≥ 20** and npm.

```bash
git clone https://github.com/ZoliQua/Nut-Sort-Game.git
cd Nut-Sort-Game
npm install
npm run dev          # http://localhost:5173
```

Production build: `npm run build && npm run preview`. The build uses relative asset paths, so `dist/` can be served from any sub-folder.

## 📏 Rules

- There are N bolts and each holds up to **4 nuts**. Every kind has exactly 4 nuts.
- A move takes the **top** nut of one bolt and puts it on another bolt whose top nut is the **same kind**, or on an **empty** bolt,
  as long as the target has room.
- **A move always takes exactly one nut** (some commercial versions move a whole run at once; one nut keeps par unambiguous).
- A level is solved when every non-empty bolt holds 4 nuts of one kind.

## 👁️ Telling nuts apart

Each kind has a fixed colour (based on the Okabe–Ito palette), width and number of notches cut into its top edge:

| Kind | Colour | Width (relative to widest) | Notches |
| --- | --- | --- | --- |
| 1 | orange `#e69f00` | 60 / 116 | 1 |
| 2 | blue `#0072b2` | 68 / 116 | 3 |
| 3 | bluish green `#009e73` | 76 / 116 | 2 |
| 4 | reddish purple `#cc79a7` | 84 / 116 | 4 |
| 5 | white `#e8eaf2` | 92 / 116 | 1 |
| 6 | yellow `#f0e442` | 100 / 116 | 3 |
| 7 | vermillion `#d55e00` | 108 / 116 | 2 |
| 8 | sky blue `#56b4e9` | 116 / 116 | 4 |

Two properties hold, and are checked by tests:

- nuts next to each other in width always have a different notch count;
- nuts with the same notch count differ by at least 32 / 116 in width.

A level with *k* kinds uses kinds 1…*k*. Width, notches and rules are identical in both looks.

## ⌨️ Controls

| Key | Action |
| --- | --- |
| 🖱️ Click / tap a bolt | Lift its top nut; click another bolt to drop it there, or the same bolt to put it back |
| **1** – **9**, **0** | Select bolt 1–10 |
| **Esc** | Put a lifted nut back (pauses when nothing is lifted) |
| **U** / **Ctrl+Z** / **Cmd+Z** | Undo the last move (+1 move) |
| **R** | Restart the level (asks first — **Enter** confirms, **Esc** keeps) |
| **Enter** / **Space** | Start · resume · next level · play again |
| **P** | Pause / resume |
| **T** | Toggle dark / light theme (standalone page) |

An illegal target shakes and leaves the nut lifted. Input is ignored while a nut is travelling, so quick double clicks never
apply two moves. Hotkeys are ignored while you type in a form field or hold Cmd/Ctrl/Alt (Ctrl/Cmd+Z excepted).

## 🎯 Scoring & stats

Per level:

```
base        = 100 × kinds
efficiency  = min(1, par / moves)              // moves = the level's move counter when solved
restartCap  = max(0.2, 1 − 0.2 × restarts)     // 1st restart → 80 %, 2nd → 60 % … floor 20 %
levelScore  = round(base × efficiency × restartCap)
```

- **Undo** reverts the last move but adds **+1** to the move counter, so a wrong move that is undone costs 2 moves.
  It is unlimited and works back to the level's start (or the last restart).
- **Restart** resets the layout and the move counter and lowers `restartCap`.
- The **run score** is the sum of the 20 level scores; the maximum is 100 × Σ kinds = **10 800**.
- After level 20 the run is recorded once with outcome `win`. A run abandoned through **New game** is **not** recorded.

The stat strip shows **Level** *n*/20, **Moves** *moves / par*, the run **Score** and the active **Time** (time is shown, not scored;
the clock stops on the level-complete card). Every finished run is recorded by the kit under `arcade.stats.nutsort`
(`best`, `plays`, `wins`, `totalScore`, `totalSeconds`, `lastScore`, `lastPlayedAt`).

## 🧩 Levels

The levels live in [`src/logic/levels.json`](./src/logic/levels.json) and are never generated or solved at runtime.

| Levels | Kinds | Bolts | Empty bolts | Par |
| --- | --- | --- | --- | --- |
| 1–2 | 2 | 3 | 1 | 6, 8 |
| 3–4 | 3 | 5 | 2 | 10, 11 |
| 5–7 | 4 | 6 | 2 | 13, 14, 15 |
| 8–10 | 5 | 7 | 2 | 16, 18, 19 |
| 11–13 | 6 | 8 | 2 | 20, 21, 22 |
| 14–16 | 7 | 9 | 2 | 25, 26, 27 |
| 17–20 | 8 | 10 | 2 | 28, 29, 30, 30 |

- **`npm run levels:generate`** ([`scripts/generate-levels.ts`](./scripts/generate-levels.ts)) shuffles seeded layouts
  (mulberry32), rejects pre-solved ones and ones with a completed bolt, and proves each candidate's minimum with the exact solver.
  Seeds over the search budget are skipped — an upper bound is never shipped. Within each band it picks candidates spread over the
  par range, so par never falls inside a band. The seeds are stored next to the levels, so a re-run reproduces the file byte for byte.
- **`npm run verify:levels`** ([`scripts/verify-levels.ts`](./scripts/verify-levels.ts)) re-solves every level without a budget and
  **without** the move pruning, asserts that the minimum equals the stored `par` and prints a timing table. It runs offline after every
  regeneration; CI only replays the stored solutions (fast).

The solver ([`src/logic/solver.ts`](./src/logic/solver.ts)) is A\* over a bolt-order-independent canonical key with an admissible
heuristic: every nut above a bolt's single-kind bottom run must move at least once, and when bottom runs of one kind sit on several
bolts, all but the largest must move. Tests check it against a plain breadth-first search on dozens of small 2–3-kind layouts.

## 💾 Autosave & resume

The session is the **whole run**: level, layout, move history, move counter, restarts and level scores (key
`arcade.session.nutsort`, schema-versioned). It is checked by a strict validator that **replays the move history** from the
level's start and rejects anything inconsistent — a layout the history does not produce, counters that do not add up, a score
above the level's maximum, or level scores that do not match the phase. It is saved about once a second, whenever the page is
hidden and when the game unmounts. Reloading shows **Welcome back** with the run paused. A finished run is never restored, so it
can never be recorded twice; **Discard** next to the *Autosaved* badge drops the save.

## 🧩 Embedding in Arcade-Game-Center

```tsx
import { NutSortGame, NutSortDemo } from '@arcade/nutsort';

<NutSortGame
  embedded                                   // hide the page title; the portal shows it
  onGameOver={(score) => submitScore('nutsort', score)}    // finished runs with points > 0
  onRunEnd={(run) => console.log(run.outcome, run.score)}  // every finished run
  onStatusChange={({ status, score, seconds }) => updateHeader(status, seconds)}
/>
<NutSortDemo active={cardIsVisible} />        // landing-page attract mode
```

Both components follow the shared `ArcadeGameProps` / `ArcadeDemoProps` contract from `src/arcade/types.ts`.
Status mapping: `idle` before the first run of a visit (Start overlay), `running` while a run is played (including the
level-complete card), `paused` while suspended (or restored), `gameOver` once level 20 is solved.

## 🧪 Scripts

| Script | Purpose |
| --- | --- |
| `npm run dev` | Vite dev server |
| `npm run build` | Type-check (`tsc -b`) and production build |
| `npm run preview` | Serve the production build |
| `npm run typecheck` | `tsc -b` |
| `npm run lint` | ESLint |
| `npm test` | Vitest (logic + component tests) |
| `npm run check` | lint → typecheck → test → build (what CI runs) |
| `npm run levels:generate` | Regenerate `src/logic/levels.json` |
| `npm run verify:levels` | Independently re-prove every level's par |

## 🏗️ Architecture

```
src/
  arcade/                 vendored Zoltan's Arcade kit — do not edit here (see its README)
  logic/                  pure game rules, no React
    types.ts constants.ts NUT_TYPES (colour, width, notches), level bands, capacity
    rules.ts              canMove, applyMove, legalMoves, isSolved
    solver.ts             exact A* with an admissible heuristic (offline only)
    levels.json levels.ts the 20 levels, validated at import
    scoring.ts            restartCap, levelScore
    game.ts               advanceGame reducer, createInitialState, runScore
    persist.ts            strict runtime validation of saved sessions (replays the history)
  hooks/                  useLook, useNutSortKeys
  components/             NutBoard (SVG), Nut, LookToggle
  demo/NutSortDemo.tsx    landing-page attract mode
  NutSortGame.tsx         the embeddable game (ArcadeGameProps)
  App.tsx                 standalone page: <ArcadeShell><NutSortGame/></ArcadeShell>
  main.tsx                entry; loads the shared arcade.css once
  index.ts                package entry used by Arcade-Game-Center
scripts/
  generate-levels.ts verify-levels.ts
```

## 🤝 Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md), the [Code of Conduct](./CODE_OF_CONDUCT.md) and [SECURITY.md](./SECURITY.md).
Contributors are listed in [CONTRIBUTORS.md](./CONTRIBUTORS.md); changes in [CHANGELOG.md](./CHANGELOG.md).

## ⚖️ License

[MIT](./LICENSE) © 2026 Zoltán Dul

---

<p align="center">Made with ❤️ by Zoltán Dul · part of <a href="https://github.com/ZoliQua/Arcade-Game-Center">Zoltan's Arcade</a></p>
