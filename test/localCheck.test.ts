import { describe, expect, it } from 'vitest';
import { isLocalCheckDue, localProblemAlerts, parseLocalStatus, stripAnsi } from '../src/core/localCheck.js';

describe('localProblemAlerts', () => {
  it('alerts once when a problem appears and stays silent while it persists', () => {
    const first = localProblemAlerts(null, 'status failed: rate limit exceeded');
    expect(first).toHaveLength(1);
    expect(first[0].severity).toBe('critical');
    expect(localProblemAlerts('status failed: rate limit exceeded', 'status failed: rate limit exceeded')).toEqual([]);
  });

  it('alerts when the problem changes and when it clears', () => {
    expect(localProblemAlerts('a', 'b')).toHaveLength(1);
    const cleared = localProblemAlerts('a', null);
    expect(cleared).toHaveLength(1);
    expect(cleared[0].severity).toBe('info');
    expect(localProblemAlerts(null, null)).toEqual([]);
  });
});

describe('isLocalCheckDue', () => {
  it('is due on first run, after the interval, and on garbage timestamps', () => {
    const now = Date.parse('2026-09-17T12:00:00Z');
    expect(isLocalCheckDue(null, 10, now)).toBe(true);
    expect(isLocalCheckDue('2026-09-17T11:55:00Z', 10, now)).toBe(false);
    expect(isLocalCheckDue('2026-09-17T11:49:00Z', 10, now)).toBe(true);
    expect(isLocalCheckDue('not a date', 10, now)).toBe(true);
  });
});

describe('stripAnsi / parseLocalStatus', () => {
  it('strips colour codes and parses boolean-ish tokens', () => {
    expect(stripAnsi('\x1b[31mHTTP error 429\x1b[0m')).toBe('HTTP error 429');
    expect(parseLocalStatus('Registered: true      Active: false')).toEqual({ registered: true, active: false });
  });
});
