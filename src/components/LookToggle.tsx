import type { Look } from '../hooks/useLook';

const OPTIONS: ReadonlyArray<{ id: Look; label: string; hint: string }> = [
  { id: 'neon', label: 'Neon', hint: 'Glowing outlines on the arcade panel' },
  { id: 'glass', label: 'Glass', hint: 'Glossy nuts on steel bolts, wooden table' },
];

/** Neon / glass switch; shapes and rules are identical in both looks. */
export function LookToggle({ look, onChange }: { look: Look; onChange: (l: Look) => void }) {
  return (
    <div className="arc-field" role="group" aria-label="Look">
      <span>Look</span>
      <div className="arc-segmented">
        {OPTIONS.map(({ id, label, hint }) => (
          <button type="button" key={id} aria-pressed={id === look} title={hint} onClick={() => onChange(id)}>
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}

export default LookToggle;
