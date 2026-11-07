import { useMessages } from '../arcade';
import type { Look } from '../hooks/useLook';
import { MESSAGES, type MessageKey } from '../i18n';

const OPTIONS: ReadonlyArray<{ id: Look; label: MessageKey; hint: MessageKey }> = [
  { id: 'neon', label: 'lookNeon', hint: 'lookNeonHint' },
  { id: 'glass', label: 'lookGlass', hint: 'lookGlassHint' },
];

/** Neon / glass switch; shapes and rules are identical in both looks. */
export function LookToggle({ look, onChange }: { look: Look; onChange: (l: Look) => void }) {
  const t = useMessages(MESSAGES);
  return (
    <div className="arc-field" role="group" aria-label={t('look')}>
      <span>{t('look')}</span>
      <div className="arc-segmented">
        {OPTIONS.map(({ id, label, hint }) => (
          <button type="button" key={id} aria-pressed={id === look} title={t(hint)} onClick={() => onChange(id)}>
            {t(label)}
          </button>
        ))}
      </div>
    </div>
  );
}

export default LookToggle;
