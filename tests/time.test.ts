import { describe, expect, it } from 'vitest';
import { formatDuration } from '../src/lib/time';

describe('formatDuration', () => {
  it('format 0 ms → 00:00', () => {
    expect(formatDuration(0)).toBe('00:00');
  });

  it('format 59s → 00:59', () => {
    expect(formatDuration(59_000)).toBe('00:59');
  });

  it('format 60s → 01:00', () => {
    expect(formatDuration(60_000)).toBe('01:00');
  });

  it('format 1h - 1s → 59:59 (senza ore se < 1h)', () => {
    expect(formatDuration(3_599_000)).toBe('59:59');
  });

  it('format 1h esatta → 01:00:00 (con ore)', () => {
    expect(formatDuration(3_600_000)).toBe('01:00:00');
  });

  it('format con showHours forza hh:mm:ss', () => {
    expect(formatDuration(5_000, { showHours: true })).toBe('00:00:05');
  });

  it('format negativo prepende il segno', () => {
    expect(formatDuration(-65_000)).toBe('-01:05');
  });

  it('troncamento ai secondi interi (floor)', () => {
    expect(formatDuration(1_999)).toBe('00:01');
  });
});
