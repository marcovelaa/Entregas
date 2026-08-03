import {
  BUSINESS_TZ,
  OFFSET_MINUTES,
  daysUntilLocal,
  localDateToUtc,
  localDateTimeToUtc,
  parseUtcOrLocal,
  utcToLocalDate,
} from './business-time';

describe('business-time (America/La_Paz, UTC-4)', () => {
  it('exposes the single business timezone (NFR-1)', () => {
    expect(BUSINESS_TZ).toBe('America/La_Paz');
  });

  it('validates the fixed offset against Intl America/La_Paz (RULES-2)', () => {
    expect(OFFSET_MINUTES).toBe(-240);
    const fmt = new Intl.DateTimeFormat('en-US', {
      timeZone: 'America/La_Paz',
      hour12: false,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
    const atLocalMidnight = fmt.format(new Date('2026-08-10T04:00:00.000Z'));
    const oneMinuteBeforeLocalMidnight = fmt.format(new Date('2026-08-10T03:59:00.000Z'));
    expect(atLocalMidnight).toContain('08/10/2026');
    expect(oneMinuteBeforeLocalMidnight).toContain('08/09/2026');
  });

  it('converts a local date string to UTC midnight plus 4h', () => {
    expect(localDateToUtc('2026-08-10').toISOString()).toBe('2026-08-10T04:00:00.000Z');
  });

  it('converts other local dates with the same offset', () => {
    expect(localDateToUtc('2026-01-01').toISOString()).toBe('2026-01-01T04:00:00.000Z');
    expect(localDateToUtc('2026-12-31').toISOString()).toBe('2026-12-31T04:00:00.000Z');
  });

  it('converts local date and time to UTC', () => {
    expect(localDateTimeToUtc('2026-08-10', '00:00').toISOString()).toBe('2026-08-10T04:00:00.000Z');
    expect(localDateTimeToUtc('2026-08-10', '23:30').toISOString()).toBe('2026-08-11T03:30:00.000Z');
  });

  it('round-trips local dates through UTC', () => {
    expect(utcToLocalDate(localDateToUtc('2026-08-10'))).toBe('2026-08-10');
    expect(utcToLocalDate(new Date('2026-08-10T23:59:00.000Z'))).toBe('2026-08-10');
    expect(utcToLocalDate(new Date('2026-08-11T03:00:00.000Z'))).toBe('2026-08-10');
  });

  it('keeps strings with a Z suffix untouched', () => {
    expect(parseUtcOrLocal('2026-08-10T04:00:00.000Z').toISOString()).toBe('2026-08-10T04:00:00.000Z');
    expect(parseUtcOrLocal('2026-08-10T04:00:00Z').toISOString()).toBe('2026-08-10T04:00:00.000Z');
  });

  it('interprets strings without Z as La Paz local', () => {
    expect(parseUtcOrLocal('2026-08-10').toISOString()).toBe('2026-08-10T04:00:00.000Z');
    expect(parseUtcOrLocal('2026-08-10T23:30').toISOString()).toBe('2026-08-11T03:30:00.000Z');
  });

  it('rejects malformed date strings', () => {
    expect(() => localDateToUtc('10-08-2026')).toThrow(RangeError);
    expect(() => parseUtcOrLocal('not-a-date')).toThrow(RangeError);
  });

  it('computes ceil calendar days between local dates', () => {
    expect(daysUntilLocal(new Date('2026-08-12T04:00:00.000Z'), new Date('2026-08-10T04:00:00.000Z'))).toBe(2);
    expect(daysUntilLocal(new Date('2026-08-10T04:00:00.000Z'), new Date('2026-08-10T04:00:00.000Z'))).toBe(0);
  });

  it('returns negative days for a fin in the past', () => {
    expect(daysUntilLocal(new Date('2026-08-08T04:00:00.000Z'), new Date('2026-08-10T04:00:00.000Z'))).toBe(-2);
  });

  it('counts calendar days, not elapsed hours', () => {
    expect(daysUntilLocal(new Date('2026-08-12T16:00:00.000Z'), new Date('2026-08-10T17:00:00.000Z'))).toBe(2);
    expect(daysUntilLocal(new Date('2026-08-12T16:00:00.000Z'), new Date('2026-08-12T14:00:00.000Z'))).toBe(0);
  });
});
