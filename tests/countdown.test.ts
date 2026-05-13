import { describe, expect, it } from 'vitest';
import {
  FIVE_MINUTES_MS,
  ONE_MINUTE_MS,
  bumpMinute,
  initialCountdownTarget,
  remainingMs,
  snapToNearestMinute,
} from '../src/lib/countdown';

describe('initialCountdownTarget', () => {
  it('aggiunge 5 minuti al now', () => {
    expect(initialCountdownTarget(1_000_000)).toBe(1_000_000 + FIVE_MINUTES_MS);
  });
});

describe('snapToNearestMinute', () => {
  it('arrotonda al minuto precedente se secondi < 30', () => {
    // 14:37:23 in ms dall'epoch arbitrario: usiamo un minuto base
    const base = 14 * 3600 * 1000 + 37 * 60 * 1000;
    const target = base + 23 * 1000;
    expect(snapToNearestMinute(target)).toBe(base);
  });

  it('arrotonda al minuto successivo se secondi >= 30', () => {
    const base = 14 * 3600 * 1000 + 37 * 60 * 1000;
    const target = base + 37 * 1000;
    expect(snapToNearestMinute(target)).toBe(base + ONE_MINUTE_MS);
  });

  it('lascia invariato un timestamp già sul minuto pieno', () => {
    const base = 14 * 3600 * 1000 + 37 * 60 * 1000;
    expect(snapToNearestMinute(base)).toBe(base);
  });

  it('arrotonda a 30s al minuto successivo (banker rounding via round)', () => {
    const base = 60_000;
    expect(snapToNearestMinute(base + 30_000)).toBe(base + ONE_MINUTE_MS);
  });
});

describe('bumpMinute', () => {
  it('+1 aggiunge 60s', () => {
    expect(bumpMinute(1_000_000, 1)).toBe(1_000_000 + ONE_MINUTE_MS);
  });

  it('-1 sottrae 60s', () => {
    expect(bumpMinute(1_000_000, -1)).toBe(1_000_000 - ONE_MINUTE_MS);
  });
});

describe('remainingMs', () => {
  it('restituisce diff positiva quando target è nel futuro', () => {
    expect(remainingMs(2_000, 1_000)).toBe(1_000);
  });

  it('non torna mai negativo', () => {
    expect(remainingMs(1_000, 5_000)).toBe(0);
  });

  it('zero quando coincidono', () => {
    expect(remainingMs(1_000, 1_000)).toBe(0);
  });
});
