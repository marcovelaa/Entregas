const HHMM_RE = /^\d{2}:\d{2}$/;

/** Coerces a raw HH:MM value to a valid string or null; never throws. */
export function parseHHMM(v: unknown): string | null {
  if (typeof v !== 'string' || !HHMM_RE.test(v)) return null;
  const hh = Number(v.slice(0, 2));
  const mm = Number(v.slice(3, 5));
  if (hh > 23 || mm > 59) return null;
  return v;
}

/** Filters a raw días-de-semana array down to valid, unique 0-6 integers. */
export function parseDiasSemana(v: unknown): number[] {
  if (!Array.isArray(v)) return [];
  const validos = v.filter(
    (d): d is number =>
      Number.isInteger(d) && (d as number) >= 0 && (d as number) <= 6,
  );
  return Array.from(new Set(validos));
}
