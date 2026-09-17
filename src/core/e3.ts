import type { Address, PublicClient } from 'viem';
import { BaseError, ContractFunctionRevertedError } from 'viem';
import { coordinatorAbi, E3Stage } from '../chain/abi/coordinator.js';
import type { E3StageCounts } from '../types.js';

export const DEFAULT_E3_SCAN_LIMIT = 5000;

function emptyStageCounts(): E3StageCounts {
  return {
    requested: 0,
    committeeFinalized: 0,
    keyPublished: 0,
    ciphertextReady: 0,
    complete: 0,
    failed: 0,
  };
}

function tallyStage(counts: E3StageCounts, stage: E3Stage): void {
  switch (stage) {
    case E3Stage.Requested:
      counts.requested += 1;
      break;
    case E3Stage.CommitteeFinalized:
      counts.committeeFinalized += 1;
      break;
    case E3Stage.KeyPublished:
      counts.keyPublished += 1;
      break;
    case E3Stage.CiphertextReady:
      counts.ciphertextReady += 1;
      break;
    case E3Stage.Complete:
      counts.complete += 1;
      break;
    case E3Stage.Failed:
      counts.failed += 1;
      break;
    case E3Stage.None:
      break;
  }
}

/**
 * Pure reducer: given a list of on-chain stages for ids 0..n-1 (in order),
 * returns the total requested count and a per-stage tally. Split out from
 * the network-walking function below so the counting logic itself is
 * unit-testable without a chain client.
 */
export function reduceE3Stages(stages: E3Stage[]): { total: number; byStage: E3StageCounts } {
  const byStage = emptyStageCounts();
  let total = 0;
  for (const stage of stages) {
    if (stage === E3Stage.None) break;
    total += 1;
    tallyStage(byStage, stage);
  }
  return { total, byStage };
}

/**
 * Walks getE3Stage(0), getE3Stage(1), ... until the first `None` stage
 * (meaning that id was never requested) or `limit` is reached. This avoids
 * relying on the coordinator's `nexte3Id()` getter, which does not decode
 * to a plausible counter when called live (see chain/abi/coordinator.ts).
 *
 * Cheap while the protocol has few E3 requests: currently (2026-09-17,
 * requestsPaused=true) this resolves in a single call because E3 id 0 has
 * never been requested.
 */
export async function scanE3Total(
  client: PublicClient,
  coordinator: Address,
  limit = DEFAULT_E3_SCAN_LIMIT,
): Promise<{ total: number; byStage: E3StageCounts; scanLimitReached: boolean }> {
  const byStage = emptyStageCounts();
  let total = 0;
  let scanLimitReached = false;

  for (let id = 0; id < limit; id += 1) {
    const stage = (await client.readContract({
      address: coordinator,
      abi: coordinatorAbi,
      functionName: 'getE3Stage',
      args: [BigInt(id)],
    })) as E3Stage;

    if (stage === E3Stage.None) {
      return { total, byStage, scanLimitReached: false };
    }
    total += 1;
    tallyStage(byStage, stage);

    if (id === limit - 1) {
      scanLimitReached = true;
    }
  }

  return { total, byStage, scanLimitReached };
}

export interface E3Details {
  id: bigint;
  stage: E3Stage;
  failureReason: number | null;
  requester: Address;
  committeeSize: number;
  requestBlock: bigint;
  e3Program: Address;
  committeePublicKeyPublished: boolean;
  ciphertextOutputPublished: boolean;
  plaintextOutputPublished: boolean;
}

const ZERO_BYTES32 = `0x${'0'.repeat(64)}` as const;

/** Fetches full details for one E3 id. Returns null if the id was never requested. */
export async function fetchE3Details(
  client: PublicClient,
  coordinator: Address,
  id: bigint,
): Promise<E3Details | null> {
  try {
    const e3 = await client.readContract({
      address: coordinator,
      abi: coordinatorAbi,
      functionName: 'getE3',
      args: [id],
    });

    const stage = (await client.readContract({
      address: coordinator,
      abi: coordinatorAbi,
      functionName: 'getE3Stage',
      args: [id],
    })) as E3Stage;

    let failureReason: number | null = null;
    if (stage === E3Stage.Failed) {
      failureReason = (await client.readContract({
        address: coordinator,
        abi: coordinatorAbi,
        functionName: 'getFailureReason',
        args: [id],
      })) as number;
    }

    return {
      id,
      stage,
      failureReason,
      requester: e3.requester,
      committeeSize: e3.committeeSize,
      requestBlock: e3.requestBlock,
      e3Program: e3.e3Program,
      committeePublicKeyPublished: e3.committeePublicKey !== ZERO_BYTES32,
      ciphertextOutputPublished: e3.ciphertextOutput !== ZERO_BYTES32,
      plaintextOutputPublished: e3.plaintextOutput !== '0x',
    };
  } catch (err) {
    if (err instanceof BaseError) {
      const revert = err.walk((e) => e instanceof ContractFunctionRevertedError);
      if (revert instanceof ContractFunctionRevertedError && revert.data?.errorName === 'E3DoesNotExist') {
        return null;
      }
    }
    throw err;
  }
}
