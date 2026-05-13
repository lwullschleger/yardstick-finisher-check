import { describe, expect, it } from 'vitest';
import { compensatedTime, rowStatus, secondsToTransition } from '../src/lib/compensated';

describe('compensatedTime', () => {
  it('returns the same time for YS=100', () => {
    expect(compensatedTime(3_600_000, 100)).toBe(3_600_000);
  });

  it('penalises faster boats (YS<100): compensato maggiore del tempo reale', () => {
    expect(compensatedTime(3_600_000, 80)).toBeGreaterThan(3_600_000);
    expect(compensatedTime(3_600_000, 80)).toBe(4_500_000);
  });

  it('bonifies slower boats (YS>100): compensato minore del tempo reale', () => {
    expect(compensatedTime(3_600_000, 120)).toBeLessThan(3_600_000);
    expect(compensatedTime(3_600_000, 120)).toBe(3_000_000);
  });
});

describe('rowStatus', () => {
  // T_comp_me = 3_600_000 ms (YS=100, T_me=1h)
  const myCompMs = 3_600_000;

  it('classe più veloce (YS<me) è verde al momento del finished', () => {
    // Al momento del finished, T_now = T_me = 3_600_000 ms
    // YS_x = 80 → comp_x = 4_500_000 > 3_600_000 → green
    expect(rowStatus(3_600_000, myCompMs, 80)).toBe('green');
  });

  it('classe più lenta (YS>me) è rossa al momento del finished', () => {
    // YS_x = 120 → comp_x = 3_000_000 < 3_600_000 → red
    expect(rowStatus(3_600_000, myCompMs, 120)).toBe('red');
  });

  it('classe con stesso YS è verde al momento del finished (edge >=)', () => {
    expect(rowStatus(3_600_000, myCompMs, 100)).toBe('green');
  });

  it('classe più lenta vira verde quando t_now sufficiente', () => {
    // YS_x=120, transition a T_now = 4_320_000 (= T_me * 120/100)
    expect(rowStatus(4_319_000, myCompMs, 120)).toBe('red');
    expect(rowStatus(4_320_000, myCompMs, 120)).toBe('green');
    expect(rowStatus(5_000_000, myCompMs, 120)).toBe('green');
  });
});

describe('secondsToTransition', () => {
  // Scenario: T_me=3_600_000, YS_me=100
  const myTimeMs = 3_600_000;
  const myYs = 100;

  it('avversario più veloce (YS<me): transition nel passato → null', () => {
    // T*_now = 3_600_000 * 80 / 100 = 2_880_000 < 3_600_000 (T_now al finished)
    expect(secondsToTransition(3_600_000, myTimeMs, myYs, 80)).toBeNull();
  });

  it('avversario più lento (YS>me): transition futuro, secondi positivi', () => {
    // T*_now = 3_600_000 * 120/100 = 4_320_000
    // T_now al finished = 3_600_000 → 720s residui
    expect(secondsToTransition(3_600_000, myTimeMs, myYs, 120)).toBe(720);
  });

  it('avversario YS uguale: transition coincide col finished → null', () => {
    expect(secondsToTransition(3_600_000, myTimeMs, myYs, 100)).toBeNull();
  });

  it('arrotonda per eccesso al secondo intero', () => {
    // T*_now = 3_600_000 * 110/100 = 3_960_000
    // Da T_now = 3_600_500 mancano 359_500 ms → ceil = 360s
    expect(secondsToTransition(3_600_500, myTimeMs, myYs, 110)).toBe(360);
  });
});
