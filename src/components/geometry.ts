/* Pure drawing helpers shared by Nut and NutBoard. */

/** Mixes a `#rrggbb` colour towards white (t > 0) or black (t < 0). */
export function shade(hex: string, t: number): string {
  const n = Number.parseInt(hex.slice(1), 16);
  const mix = (c: number) => Math.round(t >= 0 ? c + (255 - c) * t : c * (1 + t));
  const r = mix((n >> 16) & 255);
  const g = mix((n >> 8) & 255);
  const b = mix(n & 255);
  return `#${((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1)}`;
}

/** Centres of the notches cut into a nut's top edge, evenly spaced around `cx`. */
export function notchCentres(cx: number, width: number, count: number): number[] {
  const gap = Math.min(18, (width - 20) / count);
  const start = cx - (gap * (count - 1)) / 2;
  return Array.from({ length: count }, (_, i) => start + i * gap);
}

/**
 * Dental-mode crown outline (absolute M/L/Q/C commands only): a flat occlusal
 * top that carries the notches, sides that bulge and then taper to the
 * cervical margin. Its widest point is exactly `w`, so a crown is as wide as
 * the nut it replaces and the width cue survives the re-skin.
 */
export function crownPath(cx: number, y: number, w: number, h: number): string {
  const x0 = cx - w / 2;
  const x1 = cx + w / 2;
  const r = Math.min(9, h * 0.28);
  const f = (n: number) => Number(n.toFixed(2));
  const pts: (string | number)[] = [
    'M', x0 + r, y,
    'L', x1 - r, y,
    'Q', x1, y, x1, y + r,
    'C', x1, y + h * 0.62, x1 - w * 0.04, y + h * 0.9, x1 - w * 0.11, y + h,
    'L', x0 + w * 0.11, y + h,
    'C', x0 + w * 0.04, y + h * 0.9, x0, y + h * 0.62, x0, y + r,
    'Q', x0, y, x0 + r, y,
    'Z',
  ];
  return pts.map((p) => (typeof p === 'number' ? f(p) : p)).join(' ');
}
