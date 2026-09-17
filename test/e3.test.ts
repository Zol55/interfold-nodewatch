import { describe, it, expect } from 'vitest';
import { reduceE3Stages } from '../src/core/e3.js';
import { E3Stage } from '../src/chain/abi/coordinator.js';

describe('reduceE3Stages', () => {
  it('returns 0 total for an empty/all-None list ("no E3s yet")', () => {
    const { total, byStage } = reduceE3Stages([E3Stage.None]);
    expect(total).toBe(0);
    expect(byStage).toEqual({
      requested: 0,
      committeeFinalized: 0,
      keyPublished: 0,
      ciphertextReady: 0,
      complete: 0,
      failed: 0,
    });
  });

  it('stops counting at the first None (unrequested id)', () => {
    const { total } = reduceE3Stages([E3Stage.Complete, E3Stage.Requested, E3Stage.None, E3Stage.Complete]);
    expect(total).toBe(2);
  });

  it('tallies each stage independently', () => {
    const { total, byStage } = reduceE3Stages([
      E3Stage.Requested,
      E3Stage.CommitteeFinalized,
      E3Stage.KeyPublished,
      E3Stage.CiphertextReady,
      E3Stage.Complete,
      E3Stage.Failed,
      E3Stage.Complete,
    ]);
    expect(total).toBe(7);
    expect(byStage).toEqual({
      requested: 1,
      committeeFinalized: 1,
      keyPublished: 1,
      ciphertextReady: 1,
      complete: 2,
      failed: 1,
    });
  });
});
