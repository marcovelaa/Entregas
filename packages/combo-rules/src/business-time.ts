export const BUSINESS_TZ = 'America/La_Paz';

export const OFFSET_MINUTES = -240;

const LOCAL_DATE_RE = /^(\d{4})-(\d{2})-(\d{2})$/;
const LOCAL_DATETIME_RE = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/;
const TIME_RE = /^(\d{2}):(\d{2})$/;
const MS_PER_DAY = 86_400_000;

export function localDateToUtc(dateStr: string): Date {
  const m = LOCAL_DATE_RE.exec(dateStr);
  if (!m) {
    throw new RangeError(`Invalid local date, expected YYYY-MM-DD: ${dateStr}`);
  }
  return new Date(Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3]), 0, -OFFSET_MINUTES));
}

export function localDateTimeToUtc(dateStr: string, time: string): Date {
  const dm = LOCAL_DATE_RE.exec(dateStr);
  const tm = TIME_RE.exec(time);
  if (!dm || !tm) {
    throw new RangeError(`Invalid local date/time, expected YYYY-MM-DD and HH:mm: ${dateStr} ${time}`);
  }
  return new Date(Date.UTC(Number(dm[1]), Number(dm[2]) - 1, Number(dm[3]), Number(tm[1]), Number(tm[2]) - OFFSET_MINUTES));
}

export function utcToLocalDate(d: Date): string {
  const local = new Date(d.getTime() + OFFSET_MINUTES * 60_000);
  const year = local.getUTCFullYear();
  const month = String(local.getUTCMonth() + 1).padStart(2, '0');
  const day = String(local.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function parseUtcOrLocal(value: string): Date {
  if (/Z$/i.test(value)) {
    return new Date(value);
  }
  if (LOCAL_DATETIME_RE.test(value)) {
    const m = LOCAL_DATETIME_RE.exec(value);
    if (m) {
      return localDateTimeToUtc(`${m[1]}-${m[2]}-${m[3]}`, `${m[4]}:${m[5]}`);
    }
  }
  if (LOCAL_DATE_RE.test(value)) {
    return localDateToUtc(value);
  }
  throw new RangeError(`Unsupported date format, expected YYYY-MM-DD, YYYY-MM-DDTHH:mm or an ISO string with Z: ${value}`);
}

export function daysUntilLocal(fin: Date, now: Date): number {
  const finLocal = Date.parse(`${utcToLocalDate(fin)}T00:00:00Z`);
  const nowLocal = Date.parse(`${utcToLocalDate(now)}T00:00:00Z`);
  return Math.ceil((finLocal - nowLocal) / MS_PER_DAY);
}
