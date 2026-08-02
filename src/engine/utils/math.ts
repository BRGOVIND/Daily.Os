/** Small numeric helpers shared across engine algorithms. */

export function clamp(value: number, min = 0, max = 1): number {
  return Math.min(max, Math.max(min, value));
}

export function clamp01(value: number): number {
  return clamp(value, 0, 1);
}

export function round(value: number, digits = 0): number {
  const f = 10 ** digits;
  return Math.round(value * f) / f;
}

export function sum(values: number[]): number {
  return values.reduce((a, b) => a + b, 0);
}

export function mean(values: number[]): number {
  return values.length === 0 ? 0 : sum(values) / values.length;
}

/** Percentage (0..100) of done over total; 0 when total is 0. */
export function pct(done: number, total: number): number {
  return total === 0 ? 0 : Math.round((done / total) * 100);
}
