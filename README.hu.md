# 🔩 Nut Sort

[English](README.md) · [Deutsch](README.de.md) · **Magyar**

Típusbiztos Nut Sort (csavaranya-rendező) logikai játék **React 18**, **Vite** és **TypeScript** alapokon – rendezd a színes csavaranyákat csavarokra minél kevesebb lépésből.
Minden anyafajtát a **szélessége és a felső élén lévő bevágások** különböztetnek meg, így a játék színek nélkül is teljesen játszható.
**20 fix szint**, mindenkinek ugyanaz, mindegyikhez **bizonyított minimum (par)** tartozik, amelyet egy pontos A\*-megoldó talált meg.
Önállóan fut, **és** a **[Zoltan's Arcade](https://github.com/ZoliQua/Arcade-Game-Center)** tizenöt játékának egyikeként is –
játssz vele itt: [dulzoltan.hu/arcade/#/play/nutsort](https://dulzoltan.hu/arcade/#/play/nutsort).

[![CI](https://github.com/ZoliQua/Nut-Sort-Game/actions/workflows/ci.yml/badge.svg)](https://github.com/ZoliQua/Nut-Sort-Game/actions/workflows/ci.yml)
![license](https://img.shields.io/badge/license-MIT-green)
![node](https://img.shields.io/badge/node-%E2%89%A520-339933?logo=node.js&logoColor=white)
![react](https://img.shields.io/badge/React-18-61dafb?logo=react&logoColor=white)
![vite](https://img.shields.io/badge/Vite-5-646cff?logo=vite&logoColor=white)
![typescript](https://img.shields.io/badge/TypeScript-5-3178c6?logo=typescript&logoColor=white)

---

## 📑 Tartalom

- [A Zoltan's Arcade család](#%EF%B8%8F-a-zoltans-arcade-csal%C3%A1d)
- [Funkciók](#-funkci%C3%B3k)
- [Gyors indítás](#-gyors-ind%C3%ADt%C3%A1s)
- [Szabályok](#-szab%C3%A1lyok)
- [Az anyák megkülönböztetése](#%EF%B8%8F-az-any%C3%A1k-megk%C3%BCl%C3%B6nb%C3%B6ztet%C3%A9se)
- [Irányítás](#%EF%B8%8F-ir%C3%A1ny%C3%ADt%C3%A1s)
- [Pontozás és statisztika](#-pontoz%C3%A1s-%C3%A9s-statisztika)
- [Szintek](#-szintek)
- [Automatikus mentés és folytatás](#-automatikus-ment%C3%A9s-%C3%A9s-folytat%C3%A1s)
- [Beágyazás az Arcade-Game-Centerbe](#-be%C3%A1gyaz%C3%A1s-az-arcade-game-centerbe)
- [Szkriptek](#-szkriptek)
- [Felépítés](#%EF%B8%8F-fel%C3%A9p%C3%ADt%C3%A9s)
- [Közreműködés](#-k%C3%B6zrem%C5%B1k%C3%B6d%C3%A9s)
- [Licenc](#%EF%B8%8F-licenc)

## 🕹️ A Zoltan's Arcade család

Minden játék önálló repó, amely a portálba is becsatlakozik. Egy dizájnrendszert, egy pontozási modellt és egy mentési formátumot használnak a beépített [`src/arcade/`](./src/arcade) készleten (kit) keresztül.

| Játék | Repó | Műfaj |
| --- | --- | --- |
| 🏠 **Arcade portál** | [Arcade-Game-Center](https://github.com/ZoliQua/Arcade-Game-Center) | Minden játék egy helyen, élő demók, statisztika, ranglista |
| 🧱 Tetris | [Tetris-Game](https://github.com/ZoliQua/Tetris-Game) | Arcade |
| 🐍 Snake | [Snake-Game](https://github.com/ZoliQua/Snake-Game) | Reflex |
| 🔢 2048 | [2048-Game](https://github.com/ZoliQua/2048-Game) | Logikai |
| 🟡 Pac-Man | [Pac-Man-Game](https://github.com/ZoliQua/Pac-Man-Game) | Labirintus |
| ⚫ Gomoku | [Gomoku-Game](https://github.com/ZoliQua/Gomoku-Game) | Stratégia |
| 🦷 Tic-Tac-Toe | [Tic-Tac-Toe-Game](https://github.com/ZoliQua/Tic-Tac-Toe-Game) | Párbaj |
| 🏓 Breakout | [Breakout-Game](https://github.com/ZoliQua/Breakout-Game) | Ütős |
| 👾 Space Invaders | [Space-Invaders-Game](https://github.com/ZoliQua/Space-Invaders-Game) | Lövöldözős |
| 🔴 Connect Four | [Connect-Four-Game](https://github.com/ZoliQua/Connect-Four-Game) | Párbaj |
| 🔩 **Nut Sort** (ez a repó) | [Nut-Sort-Game](https://github.com/ZoliQua/Nut-Sort-Game) | Rendezős |
| 🃏 Texas Hold'em | [Texas-Holdem-Game](https://github.com/ZoliQua/Texas-Holdem-Game) | Kártya |
| 💣 Minesweeper | [Minesweeper-Game](https://github.com/ZoliQua/Minesweeper-Game) | Logikai |
| ♠️ Solitaire | [Solitaire-Game](https://github.com/ZoliQua/Solitaire-Game) | Kártya |
| 🎴 Ulti | [Ulti-Game](https://github.com/ZoliQua/Ulti-Game) | Kártya |
| 🂡 Snapszer | [Snapszer-Game](https://github.com/ZoliQua/Snapszer-Game) | Kártya |

## ✨ Funkciók

- 🔩 **Anyarendezés menetes csavarokon** – emelj fel egy anyát, és tedd egy illő anyára vagy üres csavarra; ~250 ms alatt odacsúszik
- 👁️ **Színtévesztőknek is kitalálva** – nyolc anyafajta, mindegyiknek saját szélessége **és** bevágásszáma; a szín csak ráadás
- 🧩 **20 fix szint** a 2 fajtás, 3 csavaros kezdéstől a 8 fajtás, 10 csavaros végéig – mindenkinek ugyanaz, így az eredmények összehasonlíthatók
- 📐 **Bizonyított par** – minden szinthez tartozik a pontos legkevesebb lépésszám és egy optimális megoldás
- ↩️ **Visszavonás** (egy lépésbe kerül) és **Újrakezdés** (pontba kerül, előtte rákérdez)
- 🏆 **Egységes arcade-pontozás** – a befejezett menet egyszer kerül rögzítésre; a rekordot, a játékok és a győzelmek számát a portállal közösen tárolja
- 🎨 **Két megjelenés** – *Neon* (alapértelmezett, világító körvonalak az arcade-panelen) és *Üveg* (fényes anyák, acélcsavarok, fa asztal)
- ⏸️ **Szünet** (P, vagy automatikusan, ha a lap háttérbe kerül) – megállítja a táblát és az órát
- 💾 **Automatikus mentés és folytatás** – az egész menet túléli az újratöltést és a lap bezárását
- 📖 **Szabályok ablak** a szabályos és szabálytalan lépéseket bemutató ábrával (megnyitása szünetelteti a menetet)
- 🏁 **Idő előtti befejezés** – szándékosan lezárhatod a menetet; a már megoldott szintek pontjai kerülnek a ranglistára
- 🖥️ **Teljes képernyő** gomb (iPhone-on CSS-alapú teljes képernyős mód)
- 🌗 **Sötét / világos téma**, az összes arcade-játékkal közösen (**T** billentyű)
- 🌍 **Három nyelv** – angol, magyar és német; a felső sávban vagy a beállításokban váltható (linkátadáshoz `?lang=en|hu|de` is); a számok a nyelv csoportosítását követik
- 🦷 **Fogas mód** – „Fogas mód” / „Dental mode” / „Zahnmodus” kapcsoló a beállításokban, alapból kikapcsolva (vagy `?dental=1`), az egész arcade-ban közös: a csavarok implantátumok, az anyák koronák; a szélesség- és bevágáskódolás változatlan; csak megjelenés
- 🤖 **Attract-mód demó** (`<NutSortDemo />`) – az 1–5. szint optimális megoldását játssza le
- 📱 **Telefonbarát** – a 7–10 csavar két sorba törik, így a 360 px-es képernyőn nincs vízszintes görgetés, és a bevágások látszanak
- ⌨️ **Elsősorban billentyűre tervezett és akadálymentes** – minden csavar fókuszálható gomb, amely a tartalmát is felolvassa
  (`3. csavar: 2 csavaranya, felül 6. típus (sárga, 3 bevágás)`)
- 🧪 **Tesztelt** – a szabályok, az alakkódolás, a megoldó egy nyers erővel dolgozó BFS-sel szemben, minden szint megoldása, a pontozás, a reducer,
  a mentésellenőrző, a tábla, a demó és a komponensek viselkedése

## 🚀 Gyors indítás

**Node ≥ 20** és npm szükséges.

```bash
git clone https://github.com/ZoliQua/Nut-Sort-Game.git
cd Nut-Sort-Game
npm install
npm run dev          # http://localhost:5173
```

Éles build: `npm run build && npm run preview`. A build relatív erőforrás-útvonalakat használ, így a `dist/` bármelyik almappából kiszolgálható.

## 📏 Szabályok

- N csavar van, és mindegyik legfeljebb **4 anyát** bír el. Minden fajtából pontosan 4 anya van.
- Egy lépés egy csavar **legfelső** anyáját átteszi egy másik csavarra, amelynek a legfelső anyája **ugyanolyan fajta**, vagy egy **üres** csavarra,
  feltéve hogy a célon van még hely.
- **Egy lépés mindig pontosan egy anyát mozgat** (egyes kereskedelmi változatok egyszerre egy egész sort visznek át; egy anya egyértelművé teszi a par-t).
- A szint kész, ha minden nem üres csavaron 4 egyfajta anya van.

## 👁️ Az anyák megkülönböztetése

Minden fajtának fix színe (az Okabe–Ito-paletta alapján), szélessége és a felső élébe vágott bevágásainak száma van:

| Fajta | Szín | Szélesség (a legszélesebbhez képest) | Bevágás |
| --- | --- | --- | --- |
| 1 | narancs `#e69f00` | 60 / 116 | 1 |
| 2 | kék `#0072b2` | 68 / 116 | 3 |
| 3 | kékeszöld `#009e73` | 76 / 116 | 2 |
| 4 | vöröses lila `#cc79a7` | 84 / 116 | 4 |
| 5 | fehér `#e8eaf2` | 92 / 116 | 1 |
| 6 | sárga `#f0e442` | 100 / 116 | 3 |
| 7 | cinóbervörös `#d55e00` | 108 / 116 | 2 |
| 8 | égkék `#56b4e9` | 116 / 116 | 4 |

Két tulajdonság teljesül, és tesztek ellenőrzik:

- a szélességben szomszédos anyáknak mindig különböző a bevágásszámuk;
- az azonos bevágásszámú anyák szélessége legalább 32 / 116-tal különbözik.

A *k* fajtás szint az 1…*k* fajtákat használja. A szélesség, a bevágások és a szabályok mindkét megjelenésben azonosak.

## ⌨️ Irányítás

### Telefonon

Koppints arra a csavarra, amelyikről mozgatnál (a legfelső anyája felemelkedik), majd a célcsavarra. A felemelt csavarra újra koppintva visszateszed az anyát. Minden csavar legalább 44 px széles koppintási felület, a Visszavonás, az Újrakezdés, a Szünet, a Szabályok, a Befejezés és a Teljes képernyő pedig 44 px magas gomb a tábla alatt. A **Befejezés** idő előtt lezárja a menetet, és csak a már megoldott szinteket rangsorolja (a folyamatban lévő szint nem számít; a gomb melletti megjegyzés ezt kimondja); a **Szabályok** megnyitja a szabályokat egy lépésábrával (szünetelteti a menetet). iPhone-on a *Megosztás → Főképernyőhöz adás* eltünteti a böngészősávokat.

### Billentyűzet

| Billentyű | Művelet |
| --- | --- |
| 🖱️ Kattintás / koppintás egy csavarra | Felemeli a legfelső anyáját; egy másik csavarra kattintva oda teszed le, ugyanarra kattintva visszateszed |
| **1** – **9**, **0** | Csavar kiválasztása (1–10: egy szint legtöbb csavarja; a **0** a 10. csavar) |
| **Esc** | A felemelt anya visszatétele (szünetel, ha nincs felemelve semmi) |
| **U** / **Ctrl+Z** / **Cmd+Z** | Az utolsó lépés visszavonása (a lépésszámlálót `UNDO_COST` = 1-gyel növeli) |
| **R** | A szint újrakezdése (előbb rákérdez – az **Enter** megerősít, az **Esc** marad) |
| **Enter** / **Szóköz** | Indítás · folytatás · következő szint · új menet |
| **P** | Szünet / folytatás |
| **T** | Sötét / világos téma váltása (önálló oldalon) |

A szabálytalan cél megrázkódik, az anya pedig felemelve marad. Amíg egy anya úton van, a bevitel figyelmen kívül marad, így a gyors dupla kattintás sosem hajt végre két lépést. A gyorsbillentyűk nem működnek, amíg űrlapmezőbe gépelsz, vagy Cmd/Ctrl/Alt van lenyomva (kivéve a Ctrl/Cmd+Z-t).

## 🎯 Pontozás és statisztika

Szintenként:

```
base        = 100 × fajták
efficiency  = min(1, par / lépések)            // lépések = a szint lépésszámlálója megoldáskor
restartCap  = max(0.2, 1 − 0.2 × újrakezdések) // 1. újrakezdés → 80 %, 2. → 60 % … alsó határ 20 %
levelScore  = round(base × efficiency × restartCap)
```

- A **Visszavonás** visszaveszi az utolsó lépést, de **`UNDO_COST` = 1**-gyel növeli a lépésszámlálót, így egy rossz, majd visszavont lépés 2 lépésbe kerül.
  Korlátlan, és a szint elejéig (vagy az utolsó újrakezdésig) visszamegy.
- Az **Újrakezdés** visszaállítja a kirakást és a lépésszámlálót, és csökkenti a `restartCap` értékét.
- A **menet pontszáma** a 20 szint pontjainak összege; a maximum 100 × Σ fajták = **10 800**.
- A 20. szint után a menet egyszer kerül rögzítésre `win` kimenettel. A **Befejezés** idő előtt lezárja a menetet: a pillanatnyilag mutatott pontszám (a már megoldott szintek) egyszer kerül rangsorolásra, `finished` kimenettel. Az **Új játék** gombbal feladott menet **nem** kerül rögzítésre.

Az állapotsáv a **Szintet** *n*/20, a **Lépéseket** *lépések / par*, a menet **Pontját** és az aktív **Időt** mutatja (az idő látszik, de nem számít a pontba;
az óra megáll a szint-kész kártyán). Minden befejezett menetet a kit rögzít az `arcade.stats.nutsort` kulcs alatt
(`best`, `plays`, `wins`, `totalScore`, `totalSeconds`, `lastScore`, `lastPlayedAt`).

## 🧩 Szintek

A szintek a [`src/logic/levels.json`](./src/logic/levels.json) fájlban vannak, futásidőben soha nem generálódnak és nem is oldódnak meg.

| Szintek | Fajták | Csavarok | Üres csavarok | Par |
| --- | --- | --- | --- | --- |
| 1–2 | 2 | 3 | 1 | 6, 8 |
| 3–4 | 3 | 5 | 2 | 10, 11 |
| 5–7 | 4 | 6 | 2 | 13, 14, 15 |
| 8–10 | 5 | 7 | 2 | 16, 18, 19 |
| 11–13 | 6 | 8 | 2 | 20, 21, 22 |
| 14–16 | 7 | 9 | 2 | 25, 26, 27 |
| 17–20 | 8 | 10 | 2 | 28, 29, 30, 30 |

- A **`npm run levels:generate`** ([`scripts/generate-levels.ts`](./scripts/generate-levels.ts)) fix magból (mulberry32) kever kirakásokat,
  elveti az eleve megoldottakat és azokat, amelyeknél már kész egy csavar, és a pontos megoldóval bizonyítja minden jelölt minimumát.
  A keresési keretet túllépő magokat kihagyja – felső korlátot soha nem szállít. Minden sávon belül a par tartományában szétszórt jelölteket választ, így a par
  soha nem esik egy sávon belül. A magok a szintek mellett vannak tárolva, így egy újrafuttatás bájtra pontosan előállítja ugyanazt a fájlt.
- A **`npm run verify:levels`** ([`scripts/verify-levels.ts`](./scripts/verify-levels.ts)) keret nélkül és a lépésmetszés
  **nélkül** újra megoldja az összes szintet, ellenőrzi, hogy a minimum megegyezik a tárolt `par` értékkel, és időtáblázatot ír ki. Minden
  újragenerálás után offline fut; a CI csak a tárolt megoldásokat játssza le (gyors).

A megoldó ([`src/logic/solver.ts`](./src/logic/solver.ts)) A\* egy csavarsorrendtől független kanonikus kulcson, megengedhető
heurisztikával: minden anyának, amely egy csavar egyfajtájú alsó sora fölött van, legalább egyszer mozdulnia kell, és ha egy fajta alsó sorai több
csavaron ülnek, a legnagyobbat kivéve mindnek mozdulnia kell. A tesztek egyszerű szélességi kereséssel vetik össze több tucat kis, 2–3 fajtás kirakáson.

## 💾 Automatikus mentés és folytatás

A munkamenet az **egész menet**: szint, kirakás, lépéselőzmények, lépésszámláló, újrakezdések és szintpontok (kulcs:
`arcade.session.nutsort`, sémaverziózott). Szigorú ellenőrző vizsgálja, amely a szint elejétől **újrajátssza az előzményeket**, és
elutasít minden ellentmondást – olyan kirakást, amelyet az előzmények nem állítanak elő, nem stimmelő számlálókat, a szint maximuma
fölötti pontot, vagy a fázishoz nem illő szintpontokat. Kb. másodpercenként egyszer, a lap elrejtésekor és a játék
leszerelésekor mentődik. Újratöltéskor **Üdv újra** jelenik meg szüneteltetett menettel. A befejezett menet soha nem áll vissza, így
nem rögzíthető kétszer; a *Mentve* jelvény melletti **Elvetés** törli a mentést.

## 🧩 Beágyazás az Arcade-Game-Centerbe

```tsx
import { NutSortGame, NutSortDemo } from '@arcade/nutsort';

<NutSortGame
  embedded                                   // elrejti az oldalcímet; a portál mutatja
  onGameOver={(score, info) => submitScore('nutsort', score, info?.finished)}  // a 0 pontnál többet érő menetek és minden idő előtt befejezett
  onRunEnd={(run) => console.log(run.outcome, run.score)}  // minden befejezett menet
  onStatusChange={({ status, score, seconds }) => updateHeader(status, seconds)}
/>
<NutSortDemo active={cardIsVisible} />        // nyitóoldali attract-mód
```

Mindkét komponens a `src/arcade/types.ts` közös `ArcadeGameProps` / `ArcadeDemoProps` szerződését követi.
Állapotleképezés: `idle` a látogatás első menete előtt (Start-fedőlap), `running`, amíg egy menet folyik (a szint-kész
kártyát is beleértve), `paused`, amíg szünetel (vagy visszaállított), `gameOver`, ha a 20. szint megoldódott, vagy a menetet idő előtt befejezték.

## 🧪 Szkriptek

| Szkript | Cél |
| --- | --- |
| `npm run dev` | Vite fejlesztői szerver |
| `npm run build` | Típusellenőrzés (`tsc -b`) és éles build |
| `npm run preview` | Az éles build kiszolgálása |
| `npm run typecheck` | `tsc -b` |
| `npm run lint` | ESLint |
| `npm test` | Vitest (logikai és komponenstesztek) |
| `npm run check` | lint → typecheck → test → build (amit a CI futtat) |
| `npm run levels:generate` | A `src/logic/levels.json` újragenerálása |
| `npm run verify:levels` | Minden szint parjának független újrabizonyítása |

## 🏗️ Felépítés

```
src/
  arcade/                 beépített Zoltan's Arcade kit – itt nem szerkesztjük (lásd a saját README-jét)
  logic/                  tiszta játékszabályok, React nélkül
    types.ts constants.ts NUT_TYPES (szín, szélesség, bevágás), szintsávok, kapacitás
    rules.ts              canMove, applyMove, legalMoves, isSolved
    solver.ts             pontos A* megengedhető heurisztikával (csak offline)
    levels.json levels.ts a 20 szint, importáláskor ellenőrizve
    scoring.ts            restartCap, levelScore
    game.ts               advanceGame reducer, createInitialState, runScore
    persist.ts            a mentett munkamenetek szigorú futásidejű ellenőrzése (újrajátssza az előzményeket)
  hooks/                  useLook, useNutSortKeys
  components/             NutBoard (SVG), Nut, LookToggle
  rules.tsx               a szabályok ablak szakaszai és a lépésábra
  demo/NutSortDemo.tsx    nyitóoldali attract-mód
  NutSortGame.tsx         a beágyazható játék (ArcadeGameProps)
  App.tsx                 önálló oldal: <ArcadeShell><NutSortGame/></ArcadeShell>
  main.tsx                belépési pont; egyszer tölti be a közös arcade.css-t
  index.ts                az Arcade-Game-Center által használt csomagbelépő
scripts/
  generate-levels.ts verify-levels.ts
```

## 🤝 Közreműködés

Lásd a [CONTRIBUTING.md](./CONTRIBUTING.md), a [Magatartási kódex](./CODE_OF_CONDUCT.md) és a [SECURITY.md](./SECURITY.md) fájlokat.
A közreműködők a [CONTRIBUTORS.md](./CONTRIBUTORS.md) fájlban szerepelnek; a változások a [CHANGELOG.md](./CHANGELOG.md) fájlban.

## ⚖️ Licenc

[MIT](./LICENSE) © 2026 Zoltán Dul

---

<p align="center">Készítette ❤️-tel Zoltán Dul · a <a href="https://github.com/ZoliQua/Arcade-Game-Center">Zoltan's Arcade</a> része</p>
