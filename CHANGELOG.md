# Changelog

All notable changes to this project are documented here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and the project uses
[Semantic Versioning](https://semver.org/).

## [Unreleased]

## [1.1.1] — 2026-11-14

### Changed

- Vendored kit (`src/arcade/`) updated: the registry knows the three new arcade games, Minesweeper, Solitaire and Ulti, with their accent colours.
- README: the Zoltan's Arcade family table lists all fourteen games.

## [1.1.0] — 2026-11-09

### Added

- Three languages: English, Hungarian and German, switchable in the top bar / settings and by `?lang=en|hu|de`; the choice is shared across the arcade (`arcade.lang`).
- Dental mode (off by default, shared `arcade.dental`, `?dental=1`): the bolts are implant posts and the nuts are crowns; the width and notch coding is unchanged. Presentation only: rules, scores, stats and saves are unchanged.

### Changed

- Numbers use the locale's digit grouping.
- Links now point to https://dulzoltan.hu/arcade/ (the arcade moved to its new domain).

### Added

- Hungarian and German: every game string (overlays, level and scoring texts, the Neon / Glass look, bolt labels for screen readers) follows the shared arcade language (`src/i18n.ts`).
- Dental mode (shared `arcade.dental`, off by default; toggle in the arcade top bar and in Settings): bolts become titanium implant posts set in the gum, nuts become crowns. A crown keeps its nut's exact width and notches, so the colour-free type code reads the same; works in both the Neon and Glass looks. Rules, scores and saves are unchanged.

## [1.0.1] - 2026-11-04

### Changed

- Vendored kit (`src/arcade/`) updated: the registry knows the eleventh arcade game, Texas Hold'em, with its accent colour.
- README: the Zoltan's Arcade family table lists all eleven games.

## [1.0.0] - 2026-11-01

### Added
- Nut Sort rules: bolts of capacity 4, one nut per move onto a same-kind top or an empty bolt; solved when every non-empty bolt
  holds 4 nuts of one kind.
- Colour-blind shape coding: eight kinds, each with its own width and notch count (Okabe–Ito based colours as a bonus);
  width-neighbours always differ in notches and equal notch counts differ by at least 32 / 116 in width.
- 20 fixed levels (2 kinds on 3 bolts up to 8 kinds on 10 bolts) in `src/logic/levels.json`, each with a proven `par` and one
  optimal solution, validated at import.
- Exact A* solver with a bolt-order-independent canonical key and an admissible heuristic; seeded, reproducible
  `npm run levels:generate` and an independent `npm run verify:levels` that re-proves every par without move pruning.
- Scoring: `round(100 × kinds × min(1, par / moves) × max(0.2, 1 − 0.2 × restarts))` per level; undo adds a move, restart lowers
  the cap; run maximum 10 800. A finished run is recorded once with outcome `win`; an abandoned run is not recorded.
- SVG board with two looks (Neon default, Glass), stored in `nutsort.look`; nuts glide between bolts in ~250 ms and input is
  ignored meanwhile; an illegal target shakes; 7–10 bolts render in two rows so phones keep visible notches without horizontal scroll.
- HUD (Level, Moves / par, Score, Time), Undo and Restart (with confirmation), New game (with confirmation), level-complete and
  final overlays, pause with **P** and automatically when the tab is hidden.
- Keys: **1**–**9** / **0** select bolts, **U** / **Ctrl+Z** undo, **R** restart, **Esc** put a nut back, **Enter** / **Space**
  start · next level. **T** stays the arcade theme key.
- Autosave & resume of the whole run (`arcade.session.nutsort`) with a strict validator that replays the move history;
  a finished run is never restored.
- `NutSortDemo` attract mode replaying the optimal solutions of levels 1–5.
- Accessible board: every bolt is a focusable button with a descriptive `aria-label`.
- Vitest + Testing Library suite, `npm run check`, GitHub Actions CI, community files and a game favicon.

### Notes
- The three-bolt red/green shape from the original ad (`[[green, red, red], [green, red, red], [green, green]]`) is a dead end
  with single-nut moves, so level 1 uses a solvable 2-kind layout instead; the solver tests keep the ad shape as an unsolvable case.
