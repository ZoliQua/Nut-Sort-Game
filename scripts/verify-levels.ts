/**
 * Independent par check: `npm run verify:levels`.
 * Re-solves every stored level with the exact A* solver, without a budget and
 * without the move pruning the generator uses, and asserts that the proven
 * minimum equals the stored `par`. Not part of CI; run it after every regeneration.
 */
import { LEVELS } from '../src/logic/levels';
import { solve } from '../src/logic/solver';

let failures = 0;
const started = performance.now();
console.log('level  types  bolts  par  solved  expanded      ms');
for (const level of LEVELS) {
  const t0 = performance.now();
  let expanded = 0;
  const solution = solve(level.layout, { prune: false, onStats: (s) => (expanded = s.expanded) });
  const ms = performance.now() - t0;
  const got = solution ? solution.length : null;
  const ok = got === level.par;
  if (!ok) failures++;
  console.log(
    `${String(level.id).padStart(5)}  ${String(level.types).padStart(5)}  ${String(level.layout.length).padStart(5)}` +
      `  ${String(level.par).padStart(3)}  ${String(got).padStart(6)}  ${String(expanded).padStart(8)}  ${ms.toFixed(0).padStart(6)}` +
      (ok ? '' : '  MISMATCH'),
  );
}
const total = ((performance.now() - started) / 1000).toFixed(2);
if (failures > 0) {
  console.error(`${failures} of ${LEVELS.length} levels FAILED (${total} s)`);
  process.exit(1);
}
console.log(`All ${LEVELS.length} levels confirmed: par matches an independent exact solve (${total} s total).`);
