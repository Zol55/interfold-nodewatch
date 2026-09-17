import type { Address, PublicClient } from 'viem';
import { bondingRegistryAbi } from '../chain/abi/bondingRegistry.js';
import { coordinatorAbi } from '../chain/abi/coordinator.js';
import type { ContractAddresses } from '../chain/addresses.js';
import type { Alert } from './alerts.js';
import { formatFold } from './math.js';

/**
 * Scans (fromBlock, toBlock] for events relevant to `operator` plus a few
 * protocol-wide events, and turns them into human-readable alerts. Meant to
 * be called with a small block range each poll (watch tracks the last
 * scanned block), so it stays well within public RPC log-range limits.
 */
export async function scanEventAlerts(
  client: PublicClient,
  addresses: ContractAddresses,
  operator: Address,
  fromBlock: bigint,
  toBlock: bigint,
): Promise<Alert[]> {
  if (fromBlock > toBlock) return [];

  const alerts: Alert[] = [];

  const [slashed, queuedForExit, deregistration, committeeChanges, e3Requests, pausedChanges] =
    await Promise.all([
      client.getContractEvents({
        address: addresses.bondingRegistry,
        abi: bondingRegistryAbi,
        eventName: 'PendingAssetsSlashed',
        args: { operator },
        fromBlock,
        toBlock,
      }),
      client.getContractEvents({
        address: addresses.bondingRegistry,
        abi: bondingRegistryAbi,
        eventName: 'AssetsQueuedForExit',
        args: { operator },
        fromBlock,
        toBlock,
      }),
      client.getContractEvents({
        address: addresses.bondingRegistry,
        abi: bondingRegistryAbi,
        eventName: 'CiphernodeDeregistrationRequested',
        args: { operator },
        fromBlock,
        toBlock,
      }),
      client.getContractEvents({
        address: addresses.bondingRegistry,
        abi: bondingRegistryAbi,
        eventName: 'CommitteeObligationUpdated',
        args: { operator },
        fromBlock,
        toBlock,
      }),
      client.getContractEvents({
        address: addresses.coordinator,
        abi: coordinatorAbi,
        eventName: 'E3Requested',
        fromBlock,
        toBlock,
      }),
      client.getContractEvents({
        address: addresses.coordinator,
        abi: coordinatorAbi,
        eventName: 'RequestsPausedSet',
        fromBlock,
        toBlock,
      }),
    ]);

  for (const log of slashed) {
    const args = log.args;
    alerts.push({
      severity: 'critical',
      message: `SLASHED: ${formatFold(args.ticketAmount ?? 0n)} tFOLD, ${formatFold(
        args.ciphernodeBondAmount ?? 0n,
      )} FOLD bond (tx ${log.transactionHash})`,
    });
  }

  for (const log of queuedForExit) {
    const args = log.args;
    alerts.push({
      severity: 'warning',
      message: `Exit queued: ${formatFold(args.ticketAmount ?? 0n)} tFOLD, ${formatFold(
        args.ciphernodeBondAmount ?? 0n,
      )} FOLD, unlocks at ${args.unlockTimestamp} (tx ${log.transactionHash})`,
    });
  }

  for (const log of deregistration) {
    alerts.push({
      severity: 'warning',
      message: `Deregistration requested, unlocks at ${log.args.unlockAt} (tx ${log.transactionHash})`,
    });
  }

  for (const log of committeeChanges) {
    const args = log.args;
    alerts.push({
      severity: 'info',
      message: `Committee obligation for E3 #${args.e3Id}: ${args.active ? 'joined' : 'released'} (tx ${
        log.transactionHash
      })`,
    });
  }

  if (e3Requests.length > 0) {
    alerts.push({
      severity: 'info',
      message: `${e3Requests.length} new E3 request(s) on-chain in blocks ${fromBlock}-${toBlock}`,
    });
  }

  for (const log of pausedChanges) {
    alerts.push({
      severity: log.args.paused ? 'warning' : 'info',
      message: `RequestsPausedSet: ${log.args.paused}`,
    });
  }

  return alerts;
}
