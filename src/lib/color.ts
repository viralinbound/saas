// Pick a readable text colour for a given background.

function parseColor(input: string): [number, number, number] | null {
  const s = input.trim().toLowerCase();
  let m = s.match(/^#([0-9a-f]{3})$/);
  if (m) {
    const h = m[1];
    return [parseInt(h[0] + h[0], 16), parseInt(h[1] + h[1], 16), parseInt(h[2] + h[2], 16)];
  }
  m = s.match(/^#([0-9a-f]{6})$/);
  if (m) {
    const h = m[1];
    return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
  }
  m = s.match(/^rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/);
  if (m) return [Number(m[1]), Number(m[2]), Number(m[3])];
  return null;
}

/** Relative luminance 0..1 (WCAG). */
export function luminance(color: string): number | null {
  const rgb = parseColor(color);
  if (!rgb) return null;
  const [r, g, b] = rgb.map((v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** true when the colour is dark enough that light text reads better on it. */
export function isDark(color: string): boolean {
  const l = luminance(color);
  return l !== null && l < 0.5;
}

/** A high-contrast text colour for `bg`. Falls back to `fallback` when `bg`
 *  can't be parsed (e.g. gradients, named colours). */
export function readableTextOn(bg: string, fallback?: string): string {
  const l = luminance(bg);
  if (l === null) return fallback ?? "#0F172A";
  return l < 0.5 ? "#FFFFFF" : "#0F172A";
}
