import { describe, it, expect } from 'vitest';
import { diffSnapshots, rpcFailureAlert, type WatchSnapshot } from '../src/core/alerts.js';

function baseSnapshot(overrides: Partial<WatchSnapshot> = {}): WatchSnapshot {
  return {
    registered: true,
    active: true,
    bondRaw: (32000n * 10n ** 18n).toString(),
    tickets: 2,
    requestsPaused: false,
    e3Total: 0,
    lastScannedBlock: '100',
    consecutiveRpcFailures: 0,
    ...overrides,
  };
}

describe('diffSnapshots', () => {
  it('is silent when nothing changed', () => {
    const prev = baseSnapshot();
    const curr = baseSnapshot();
    expect(diffSnapshots(prev, curr)).toEqual([]);
  });

  it('flags registration going false as critical', () => {
    const prev = baseSnapshot({ registered: true });
    const curr = baseSnapshot({ registered: false });
    const alerts = diffSnapshots(prev, curr);
    expect(alerts).toHaveLength(1);
    expect(alerts[0]?.severity).toBe('critical');
    expect(alerts[0]?.message).toMatch(/Registration changed/);
  });

  it('flags active going false as critical, going true as info', () => {
    const wentInactive = diffSnapshots(baseSnapshot({ active: true }), baseSnapshot({ active: false }));
    expect(wentInactive[0]?.severity).toBe('critical');

    const wentActive = diffSnapshots(baseSnapshot({ active: false }), baseSnapshot({ active: true }));
    expect(wentActive[0]?.severity).toBe('info');
  });

  it('flags a bond decrease as critical and an increase as info', () => {
    const decreased = diffSnapshots(
      baseSnapshot({ bondRaw: (32000n * 10n ** 18n).toString() }),
      baseSnapshot({ bondRaw: (16000n * 10n ** 18n).toString() }),
    );
    expect(decreased[0]?.severity).toBe('critical');

    const increased = diffSnapshots(
      baseSnapshot({ bondRaw: (32000n * 10n ** 18n).toString() }),
      baseSnapshot({ bondRaw: (33000n * 10n ** 18n).toString() }),
    );
    expect(increased[0]?.severity).toBe('info');
  });

  it('flags a ticket decrease as warning and an increase as info', () => {
    const decreased = diffSnapshots(baseSnapshot({ tickets: 2 }), baseSnapshot({ tickets: 1 }));
    expect(decreased[0]?.severity).toBe('warning');

    const increased = diffSnapshots(baseSnapshot({ tickets: 2 }), baseSnapshot({ tickets: 3 }));
    expect(increased[0]?.severity).toBe('info');
  });

  it('flags requestsPaused flipping to true as warning, to false as info', () => {
    const paused = diffSnapshots(
      baseSnapshot({ requestsPaused: false }),
      baseSnapshot({ requestsPaused: true }),
    );
    expect(paused[0]?.severity).toBe('warning');

    const unpaused = diffSnapshots(
      baseSnapshot({ requestsPaused: true }),
      baseSnapshot({ requestsPaused: false }),
    );
    expect(unpaused[0]?.severity).toBe('info');
  });

  it('flags new E3 requests as info, and never fires on e3Total decreasing', () => {
    const grew = diffSnapshots(baseSnapshot({ e3Total: 0 }), baseSnapshot({ e3Total: 3 }));
    expect(grew).toHaveLength(1);
    expect(grew[0]?.message).toMatch(/3 new E3 request/);

    const shrank = diffSnapshots(baseSnapshot({ e3Total: 3 }), baseSnapshot({ e3Total: 1 }));
    expect(shrank).toEqual([]);
  });

  it('reports multiple simultaneous changes independently', () => {
    const prev = baseSnapshot({ active: true, tickets: 2 });
    const curr = baseSnapshot({ active: false, tickets: 1 });
    const alerts = diffSnapshots(prev, curr);
    expect(alerts).toHaveLength(2);
  });
});

describe('rpcFailureAlert', () => {
  it('does not fire below the threshold', () => {
    expect(rpcFailureAlert(0, 1, 3)).toBeNull();
    expect(rpcFailureAlert(1, 2, 3)).toBeNull();
  });

  it('fires exactly once when crossing the threshold', () => {
    expect(rpcFailureAlert(2, 3, 3)).not.toBeNull();
    expect(rpcFailureAlert(3, 4, 3)).toBeNull(); // already alerted, stays quiet while still failing
  });

  it('fires a recovery alert when failures drop back to 0 after crossing the threshold', () => {
    expect(rpcFailureAlert(5, 0, 3)).not.toBeNull();
  });

  it('does not fire a recovery alert if the threshold was never crossed', () => {
    expect(rpcFailureAlert(1, 0, 3)).toBeNull();
  });
});
