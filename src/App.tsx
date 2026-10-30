import { ArcadeShell } from './arcade';
import { NutSortGame } from './NutSortGame';

export default function App() {
  return (
    <ArcadeShell gameId="nutsort">
      <NutSortGame />
    </ArcadeShell>
  );
}
