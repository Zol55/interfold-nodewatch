import { describe, it, expect } from 'vitest';
import {
  weiToWholeTokens,
  ticketsFromBalance,
  totalTicketsFromSupply,
  computeTicketSharePercent,
  formatFold,
} from '../src/core/math.js';

describe('weiToWholeTokens', () => {
  it('truncates to whole tokens for 18 decimals', () => {
    expect(weiToWholeTokens(32000n * 10n ** 18n)).toBe(32000);
  });

  it('truncates fractional remainder', () => {
    expect(weiToWholeTokens(32000_500000000000000000n)).toBe(32000);
  });

  it('returns 0 for 0', () => {
    expect(weiToWholeTokens(0n)).toBe(0);
  });
});

describe('ticketsFromBalance', () => {
  it('matches the known operator case: 2000 tFOLD at 1000 tFOLD/ticket = 2 tickets', () => {
    const balance = 2000n * 10n ** 18n;
    const price = 1000n * 10n ** 18n;
    expect(ticketsFromBalance(balance, price)).toBe(2);
  });

  it('returns 0 when ticket price is 0 (avoids division by zero)', () => {
    expect(ticketsFromBalance(1000n, 0n)).toBe(0);
  });

  it('truncates partial tickets', () => {
    const balance = 1999n * 10n ** 18n;
    const price = 1000n * 10n ** 18n;
    expect(ticketsFromBalance(balance, price)).toBe(1);
  });
});

describe('totalTicketsFromSupply', () => {
  it('matches the known network case: ~61000 tFOLD supply at 1000/ticket', () => {
    const supply = 61_000n * 10n ** 18n;
    const price = 1000n * 10n ** 18n;
    expect(totalTicketsFromSupply(supply, price)).toBe(61);
  });
});

describe('computeTicketSharePercent', () => {
  it('computes our known share: 2 of 61 tickets', () => {
    expect(computeTicketSharePercent(2, 61)).toBeCloseTo(3.28, 2);
  });

  it('returns 0 when total is 0', () => {
    expect(computeTicketSharePercent(5, 0)).toBe(0);
  });

  it('returns 100 when we hold all tickets', () => {
    expect(computeTicketSharePercent(10, 10)).toBe(100);
  });
});

describe('formatFold', () => {
  it('formats with thousands separators', () => {
    expect(formatFold(32000n * 10n ** 18n)).toBe('32,000');
  });
});
