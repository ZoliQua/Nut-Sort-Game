# 🔩 Nut Sort

[English](README.md) · **Deutsch** · [Magyar](README.hu.md)

Ein typsicheres Nut-Sort-Puzzle mit **React 18**, **Vite** und **TypeScript** – sortiere bunte Muttern mit möglichst wenigen Zügen auf Schrauben.
Jede Mutternsorte erkennst du an ihrer **Breite und den Kerben an der Oberkante**, das Spiel ist also komplett ohne Farben spielbar.
**20 feste Level**, für alle Spieler gleich, jedes mit einem **bewiesenen Minimum (Par)**, gefunden von einem exakten A\*-Löser.
Läuft allein **und** als eines der fünfzehn Spiele von **[Zoltan's Arcade](https://github.com/ZoliQua/Arcade-Game-Center)** –
spiele es auf [dulzoltan.hu/arcade/#/play/nutsort](https://dulzoltan.hu/arcade/#/play/nutsort).

[![CI](https://github.com/ZoliQua/Nut-Sort-Game/actions/workflows/ci.yml/badge.svg)](https://github.com/ZoliQua/Nut-Sort-Game/actions/workflows/ci.yml)
![license](https://img.shields.io/badge/license-MIT-green)
![node](https://img.shields.io/badge/node-%E2%89%A520-339933?logo=node.js&logoColor=white)
![react](https://img.shields.io/badge/React-18-61dafb?logo=react&logoColor=white)
![vite](https://img.shields.io/badge/Vite-5-646cff?logo=vite&logoColor=white)
![typescript](https://img.shields.io/badge/TypeScript-5-3178c6?logo=typescript&logoColor=white)

---

## 📑 Inhaltsverzeichnis

- [Die Zoltan's-Arcade-Familie](#%EF%B8%8F-die-zoltans-arcade-familie)
- [Funktionen](#-funktionen)
- [Schnellstart](#-schnellstart)
- [Regeln](#-regeln)
- [Muttern unterscheiden](#%EF%B8%8F-muttern-unterscheiden)
- [Steuerung](#%EF%B8%8F-steuerung)
- [Wertung & Statistik](#-wertung--statistik)
- [Level](#-level)
- [Autosave & Fortsetzen](#-autosave--fortsetzen)
- [Einbindung in Arcade-Game-Center](#-einbindung-in-arcade-game-center)
- [Skripte](#-skripte)
- [Architektur](#%EF%B8%8F-architektur)
- [Mitmachen](#-mitmachen)
- [Lizenz](#%EF%B8%8F-lizenz)

## 🕹️ Die Zoltan's-Arcade-Familie

Jedes Spiel ist ein eigenständiges Repo, das sich auch ins Portal einklinkt. Alle teilen sich ein Designsystem, ein Wertungsmodell und ein Speicherformat über das mitgelieferte Kit [`src/arcade/`](./src/arcade).

| Spiel | Repo | Genre |
| --- | --- | --- |
| 🏠 **Arcade-Portal** | [Arcade-Game-Center](https://github.com/ZoliQua/Arcade-Game-Center) | Alle Spiele an einem Ort, Live-Demos, Statistik, Bestenliste |
| 🧱 Tetris | [Tetris-Game](https://github.com/ZoliQua/Tetris-Game) | Arcade |
| 🐍 Snake | [Snake-Game](https://github.com/ZoliQua/Snake-Game) | Reflex |
| 🔢 2048 | [2048-Game](https://github.com/ZoliQua/2048-Game) | Puzzle |
| 🟡 Pac-Man | [Pac-Man-Game](https://github.com/ZoliQua/Pac-Man-Game) | Labyrinth |
| ⚫ Gomoku | [Gomoku-Game](https://github.com/ZoliQua/Gomoku-Game) | Strategie |
| 🦷 Tic-Tac-Toe | [Tic-Tac-Toe-Game](https://github.com/ZoliQua/Tic-Tac-Toe-Game) | Duell |
| 🏓 Breakout | [Breakout-Game](https://github.com/ZoliQua/Breakout-Game) | Schläger |
| 👾 Space Invaders | [Space-Invaders-Game](https://github.com/ZoliQua/Space-Invaders-Game) | Shooter |
| 🔴 Vier gewinnt | [Connect-Four-Game](https://github.com/ZoliQua/Connect-Four-Game) | Duell |
| 🔩 **Nut Sort** (dieses Repo) | [Nut-Sort-Game](https://github.com/ZoliQua/Nut-Sort-Game) | Sortieren |
| 🃏 Texas Hold'em | [Texas-Holdem-Game](https://github.com/ZoliQua/Texas-Holdem-Game) | Karten |
| 💣 Minesweeper | [Minesweeper-Game](https://github.com/ZoliQua/Minesweeper-Game) | Logik |
| ♠️ Solitaire | [Solitaire-Game](https://github.com/ZoliQua/Solitaire-Game) | Karten |
| 🎴 Ulti | [Ulti-Game](https://github.com/ZoliQua/Ulti-Game) | Karten |
| 🂡 Snapszer | [Snapszer-Game](https://github.com/ZoliQua/Snapszer-Game) | Karten |

## ✨ Funktionen

- 🔩 **Muttern sortieren auf Gewindeschrauben** – hebe eine Mutter an und lege sie auf eine passende Mutter oder eine leere Schraube; sie gleitet in ~250 ms dorthin
- 👁️ **Für Farbenblinde gemacht** – acht Mutternsorten, jede mit eigener Breite **und** Kerbenzahl; die Farbe ist nur ein Bonus
- 🧩 **20 feste Level** von 2 Sorten auf 3 Schrauben bis 8 Sorten auf 10 Schrauben – für alle gleich, die Ergebnisse sind vergleichbar
- 📐 **Bewiesenes Par** – jedes Level kommt mit seiner exakten Mindestzahl an Zügen und einer optimalen Lösung
- ↩️ **Rückgängig** (kostet einen Zug) und **Neustart** (kostet Punkte, fragt vorher nach)
- 🏆 **Einheitliche Arcade-Wertung** – ein beendeter Durchgang wird genau einmal erfasst; Bestwert, Spiele und Siege teilt das Spiel mit dem Portal
- 🎨 **Zwei Optiken** – *Neon* (Standard, leuchtende Umrisse auf dem Arcade-Panel) und *Glas* (glänzende Muttern, Stahlschrauben, Holztisch)
- ⏸️ **Pause** (P, oder automatisch, wenn der Tab verborgen wird) – friert Brett und Uhr ein
- 💾 **Autosave & Fortsetzen** – der ganze Durchgang übersteht Neuladen und Schließen des Tabs
- 📖 **Regeln-Dialog** mit einem Diagramm erlaubter und nicht erlaubter Züge (das Öffnen pausiert den Durchgang)
- 🏁 **Vorzeitig beenden** – beende den Durchgang bewusst; die Punkte der bisher gelösten Level kommen in die Bestenliste
- 🖥️ **Vollbild**-Schaltfläche (CSS-Vollbildmodus auf dem iPhone)
- 🌗 **Dunkles / helles Design**, geteilt mit jedem Arcade-Spiel (Taste **T**)
- 🌍 **Drei Sprachen** – Englisch, Ungarisch und Deutsch; umschaltbar in der oberen Leiste oder in den Einstellungen (auch `?lang=en|hu|de` für Link-Übergaben); Zahlen folgen der Gruppierung der Sprache
- 🦷 **Zahnmodus** – ein Schalter „Fogas mód“ / „Dental mode“ / „Zahnmodus“ in den Einstellungen, standardmäßig aus (oder `?dental=1`), im ganzen Arcade geteilt: Die Schrauben sind Implantate und die Muttern Kronen; die Kodierung durch Breite und Kerben bleibt; nur die Darstellung ändert sich
- 🤖 **Attract-Mode-Demo** (`<NutSortDemo />`) – spielt die optimalen Lösungen der Level 1–5 ab
- 📱 **Handy-tauglich** – 7–10 Schrauben werden auf zwei Reihen verteilt, sodass ein 360-px-Bildschirm nicht horizontal scrollt und die Kerben sichtbar bleiben
- ⌨️ **Tastatur zuerst und barrierefrei** – jede Schraube ist eine fokussierbare Schaltfläche mit Beschriftung ihres Inhalts
  (`Schraube 3: 2 Muttern, oben Sorte 6 (gelb, 3 Kerben)`)
- 🧪 **Getestet** – Regeln, Formkodierung, der Löser gegen eine Brute-Force-BFS, die Lösung jedes Levels, Wertung, der Reducer,
  der Speicher-Validator, das Brett, die Demo und das Komponentenverhalten

## 🚀 Schnellstart

Benötigt **Node ≥ 20** und npm.

```bash
git clone https://github.com/ZoliQua/Nut-Sort-Game.git
cd Nut-Sort-Game
npm install
npm run dev          # http://localhost:5173
```

Produktions-Build: `npm run build && npm run preview`. Der Build nutzt relative Asset-Pfade, daher kann `dist/` aus jedem Unterordner ausgeliefert werden.

## 📏 Regeln

- Es gibt N Schrauben, und jede fasst bis zu **4 Muttern**. Jede Sorte hat genau 4 Muttern.
- Ein Zug nimmt die **oberste** Mutter einer Schraube und legt sie auf eine andere Schraube, deren oberste Mutter von der **gleichen Sorte** ist, oder auf eine **leere** Schraube,
  solange das Ziel noch Platz hat.
- **Ein Zug bewegt immer genau eine Mutter** (manche kommerzielle Versionen bewegen eine ganze Reihe auf einmal; eine Mutter hält das Par eindeutig).
- Ein Level ist gelöst, wenn jede nicht leere Schraube 4 Muttern einer Sorte trägt.

## 👁️ Muttern unterscheiden

Jede Sorte hat eine feste Farbe (nach der Okabe-Ito-Palette), eine Breite und eine Anzahl Kerben in ihrer Oberkante:

| Sorte | Farbe | Breite (relativ zur breitesten) | Kerben |
| --- | --- | --- | --- |
| 1 | Orange `#e69f00` | 60 / 116 | 1 |
| 2 | Blau `#0072b2` | 68 / 116 | 3 |
| 3 | Blaugrün `#009e73` | 76 / 116 | 2 |
| 4 | Rötliches Lila `#cc79a7` | 84 / 116 | 4 |
| 5 | Weiß `#e8eaf2` | 92 / 116 | 1 |
| 6 | Gelb `#f0e442` | 100 / 116 | 3 |
| 7 | Zinnoberrot `#d55e00` | 108 / 116 | 2 |
| 8 | Himmelblau `#56b4e9` | 116 / 116 | 4 |

Zwei Eigenschaften gelten und werden von Tests geprüft:

- in der Breite benachbarte Muttern haben immer eine andere Kerbenzahl;
- Muttern mit gleicher Kerbenzahl unterscheiden sich in der Breite um mindestens 32 / 116.

Ein Level mit *k* Sorten nutzt die Sorten 1…*k*. Breite, Kerben und Regeln sind in beiden Optiken identisch.

## ⌨️ Steuerung

### Auf dem Handy

Tippe auf die Schraube, von der du etwas bewegen willst (ihre oberste Mutter hebt sich), dann auf die Zielschraube. Tippst du die angehobene Schraube erneut an, legst du die Mutter zurück. Jede Schraube ist eine Tippfläche von mindestens 44 px Breite, und Rückgängig, Neustart, Pause, Regeln, Beenden und Vollbild sind 44-px-Schaltflächen unter dem Spielbrett. **Beenden** beendet den Durchgang vorzeitig und wertet nur die bereits gelösten Level (das laufende Level zählt nicht; ein Hinweis neben der Schaltfläche sagt das); **Regeln** öffnet die Regeln mit einem Zugdiagramm (das pausiert den Durchgang). Auf dem iPhone entfernt *Teilen → Zum Home-Bildschirm* die Browserleisten.

### Tastatur

| Taste | Aktion |
| --- | --- |
| 🖱️ Schraube anklicken / antippen | Hebt ihre oberste Mutter an; klicke eine andere Schraube an, um sie dort abzulegen, oder dieselbe, um sie zurückzulegen |
| **1** – **9**, **0** | Schraube wählen (1–10: die meisten Schrauben eines Levels; **0** ist Schraube 10) |
| **Esc** | Angehobene Mutter zurücklegen (pausiert, wenn nichts angehoben ist) |
| **U** / **Ctrl+Z** / **Cmd+Z** | Den letzten Zug rückgängig machen (erhöht den Zugzähler um `UNDO_COST` = 1) |
| **R** | Level neu starten (fragt vorher – **Enter** bestätigt, **Esc** behält) |
| **Enter** / **Leertaste** | Starten · fortsetzen · nächstes Level · nochmal spielen |
| **P** | Pause / weiter |
| **T** | Dunkles / helles Design umschalten (eigenständige Seite) |

Ein unzulässiges Ziel wackelt und lässt die Mutter angehoben. Eingaben werden ignoriert, solange eine Mutter unterwegs ist, damit schnelle Doppelklicks nie zwei Züge auslösen. Tastenkürzel werden ignoriert, solange du in ein Formularfeld tippst oder Cmd/Ctrl/Alt hältst (Ctrl/Cmd+Z ausgenommen).

## 🎯 Wertung & Statistik

Pro Level:

```
base        = 100 × Sorten
efficiency  = min(1, par / Züge)               // Züge = Zugzähler des Levels beim Lösen
restartCap  = max(0.2, 1 − 0.2 × Neustarts)    // 1. Neustart → 80 %, 2. → 60 % … Untergrenze 20 %
levelScore  = round(base × efficiency × restartCap)
```

- **Rückgängig** macht den letzten Zug zurück, erhöht aber den Zugzähler um **`UNDO_COST` = 1**; ein falscher Zug, der zurückgenommen wird, kostet also 2 Züge.
  Es ist unbegrenzt und reicht bis zum Levelstart (oder zum letzten Neustart).
- **Neustart** setzt Anordnung und Zugzähler zurück und senkt `restartCap`.
- Der **Durchgangswert** ist die Summe der 20 Levelwerte; das Maximum ist 100 × Σ Sorten = **10 800**.
- Nach Level 20 wird der Durchgang einmal mit dem Ergebnis `win` erfasst. **Beenden** beendet den Durchgang vorzeitig: Der in dem Moment angezeigte Wert (die bisher gelösten Level) wird einmal gewertet, mit dem Ergebnis `finished`. Ein über **Neues Spiel** abgebrochener Durchgang wird **nicht** erfasst.

Die Statusleiste zeigt **Level** *n*/20, **Züge** *Züge / Par*, den **Punktestand** des Durchgangs und die aktive **Zeit** (die Zeit wird angezeigt, nicht gewertet;
die Uhr hält auf der Level-geschafft-Karte an). Jeder beendete Durchgang wird vom Kit unter `arcade.stats.nutsort` erfasst
(`best`, `plays`, `wins`, `totalScore`, `totalSeconds`, `lastScore`, `lastPlayedAt`).

## 🧩 Level

Die Level liegen in [`src/logic/levels.json`](./src/logic/levels.json) und werden zur Laufzeit nie erzeugt oder gelöst.

| Level | Sorten | Schrauben | Leere Schrauben | Par |
| --- | --- | --- | --- | --- |
| 1–2 | 2 | 3 | 1 | 6, 8 |
| 3–4 | 3 | 5 | 2 | 10, 11 |
| 5–7 | 4 | 6 | 2 | 13, 14, 15 |
| 8–10 | 5 | 7 | 2 | 16, 18, 19 |
| 11–13 | 6 | 8 | 2 | 20, 21, 22 |
| 14–16 | 7 | 9 | 2 | 25, 26, 27 |
| 17–20 | 8 | 10 | 2 | 28, 29, 30, 30 |

- **`npm run levels:generate`** ([`scripts/generate-levels.ts`](./scripts/generate-levels.ts)) mischt Anordnungen mit festem Seed
  (mulberry32), verwirft bereits gelöste und solche mit fertiger Schraube und beweist das Minimum jedes Kandidaten mit dem exakten Löser.
  Seeds über dem Suchbudget werden übersprungen – eine obere Schranke wird nie ausgeliefert. Innerhalb jedes Bandes werden Kandidaten gewählt, die über den
  Par-Bereich verteilt sind, sodass das Par nie innerhalb eines Bandes fällt. Die Seeds liegen neben den Leveln, ein erneuter Lauf reproduziert die Datei Byte für Byte.
- **`npm run verify:levels`** ([`scripts/verify-levels.ts`](./scripts/verify-levels.ts)) löst jedes Level ohne Budget und
  **ohne** das Zug-Pruning neu, prüft, dass das Minimum dem gespeicherten `par` entspricht, und gibt eine Zeittabelle aus. Es läuft offline nach jeder
  Neugenerierung; die CI spielt nur die gespeicherten Lösungen ab (schnell).

Der Löser ([`src/logic/solver.ts`](./src/logic/solver.ts)) ist A\* über einen von der Schraubenreihenfolge unabhängigen kanonischen Schlüssel mit einer zulässigen
Heuristik: Jede Mutter über dem einsortigen untersten Abschnitt einer Schraube muss mindestens einmal bewegt werden, und wenn unterste Abschnitte einer Sorte auf mehreren
Schrauben liegen, müssen alle außer dem größten bewegt werden. Tests prüfen ihn gegen eine einfache Breitensuche auf Dutzenden kleiner Anordnungen mit 2–3 Sorten.

## 💾 Autosave & Fortsetzen

Die Sitzung ist der **ganze Durchgang**: Level, Anordnung, Zugverlauf, Zugzähler, Neustarts und Levelwerte (Schlüssel
`arcade.session.nutsort`, schemaversioniert). Ein strenger Validator prüft sie, der den **Zugverlauf** vom Levelstart aus **nachspielt** und
alles Widersprüchliche ablehnt – eine Anordnung, die der Verlauf nicht erzeugt, Zähler, die nicht zusammenpassen, einen Wert
über dem Maximum des Levels oder Levelwerte, die nicht zur Phase passen. Gespeichert wird etwa einmal pro Sekunde, sobald die Seite
verborgen wird und beim Unmount des Spiels. Beim Neuladen erscheint **Willkommen zurück** mit pausiertem Durchgang. Ein beendeter Durchgang wird nie wiederhergestellt, damit er
nie zweimal erfasst werden kann; **Verwerfen** neben dem Badge *Automatisch gespeichert* löscht den Speicherstand.

## 🧩 Einbindung in Arcade-Game-Center

```tsx
import { NutSortGame, NutSortDemo } from '@arcade/nutsort';

<NutSortGame
  embedded                                   // Seitentitel ausblenden; das Portal zeigt ihn
  onGameOver={(score, info) => submitScore('nutsort', score, info?.finished)}  // Durchgänge mit Punkten > 0 und jeder vorzeitig beendete
  onRunEnd={(run) => console.log(run.outcome, run.score)}  // jeder beendete Durchgang
  onStatusChange={({ status, score, seconds }) => updateHeader(status, seconds)}
/>
<NutSortDemo active={cardIsVisible} />        // Attract-Mode der Startseite
```

Beide Komponenten folgen dem gemeinsamen Vertrag `ArcadeGameProps` / `ArcadeDemoProps` aus `src/arcade/types.ts`.
Status-Zuordnung: `idle` vor dem ersten Durchgang eines Besuchs (Start-Overlay), `running`, solange ein Durchgang gespielt wird (auch auf
der Level-geschafft-Karte), `paused`, solange er unterbrochen (oder wiederhergestellt) ist, `gameOver`, sobald Level 20 gelöst oder der Durchgang vorzeitig beendet ist.

## 🧪 Skripte

| Skript | Zweck |
| --- | --- |
| `npm run dev` | Vite-Entwicklungsserver |
| `npm run build` | Typprüfung (`tsc -b`) und Produktions-Build |
| `npm run preview` | Produktions-Build ausliefern |
| `npm run typecheck` | `tsc -b` |
| `npm run lint` | ESLint |
| `npm test` | Vitest (Logik- und Komponententests) |
| `npm run check` | lint → typecheck → test → build (was die CI ausführt) |
| `npm run levels:generate` | `src/logic/levels.json` neu erzeugen |
| `npm run verify:levels` | Das Par jedes Levels unabhängig neu beweisen |

## 🏗️ Architektur

```
src/
  arcade/                 mitgeliefertes Zoltan's-Arcade-Kit – hier nicht bearbeiten (siehe dessen README)
  logic/                  reine Spielregeln, ohne React
    types.ts constants.ts NUT_TYPES (Farbe, Breite, Kerben), Level-Bänder, Kapazität
    rules.ts              canMove, applyMove, legalMoves, isSolved
    solver.ts             exakter A* mit zulässiger Heuristik (nur offline)
    levels.json levels.ts die 20 Level, beim Import validiert
    scoring.ts            restartCap, levelScore
    game.ts               advanceGame-Reducer, createInitialState, runScore
    persist.ts            strenge Laufzeitprüfung gespeicherter Sitzungen (spielt den Verlauf nach)
  hooks/                  useLook, useNutSortKeys
  components/             NutBoard (SVG), Nut, LookToggle
  rules.tsx               Abschnitte des Regeln-Dialogs und das Zugdiagramm
  demo/NutSortDemo.tsx    Attract-Mode der Startseite
  NutSortGame.tsx         das einbettbare Spiel (ArcadeGameProps)
  App.tsx                 eigenständige Seite: <ArcadeShell><NutSortGame/></ArcadeShell>
  main.tsx                Einstieg; lädt die gemeinsame arcade.css einmal
  index.ts                Paket-Einstieg für Arcade-Game-Center
scripts/
  generate-levels.ts verify-levels.ts
```

## 🤝 Mitmachen

Siehe [CONTRIBUTING.md](./CONTRIBUTING.md), den [Verhaltenskodex](./CODE_OF_CONDUCT.md) und [SECURITY.md](./SECURITY.md).
Mitwirkende stehen in [CONTRIBUTORS.md](./CONTRIBUTORS.md); Änderungen in [CHANGELOG.md](./CHANGELOG.md).

## ⚖️ Lizenz

[MIT](./LICENSE) © 2026 Zoltán Dul

---

<p align="center">Mit ❤️ gemacht von Zoltán Dul · Teil von <a href="https://github.com/ZoliQua/Arcade-Game-Center">Zoltan's Arcade</a></p>
