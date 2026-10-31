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
