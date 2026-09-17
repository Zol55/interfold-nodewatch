import { Registry, Gauge } from 'prom-client';
import type { NodeStatusReport } from '../types.js';
import { E3_STAGE_NAMES, E3Stage } from '../chain/abi/coordinator.js';

export interface ReleaseInfo {
  latestTag: string | null;
  localVersion: string | null;
  updateAvailable: boolean;
}

export interface NodewatchMetrics {
  registry: Registry;
  rpcUp: Gauge<string>;
  update(report: NodeStatusReport): void;
  markRpcDown(): void;
  updateRelease(info: ReleaseInfo): void;
}

export function createMetrics(): NodewatchMetrics {
  const registry = new Registry();

  const operatorRegistered = new Gauge({
    name: 'interfold_operator_registered',
    help: '1 if the configured operator is registered in BondingRegistry, else 0',
    registers: [registry],
  });
  const operatorActive = new Gauge({
    name: 'interfold_operator_active',
    help: '1 if the configured operator is active, else 0',
    registers: [registry],
  });
  const operatorBondFold = new Gauge({
    name: 'interfold_operator_bond_fold',
    help: "Operator's ciphernode bond, in whole FOLD",
    registers: [registry],
  });
  const operatorTickets = new Gauge({
    name: 'interfold_operator_tickets',
    help: "Operator's ticket count",
    registers: [registry],
  });
  const networkTickets = new Gauge({
    name: 'interfold_network_tickets',
    help: 'Total tickets network-wide (tFOLD.totalSupply / ticketPrice)',
    registers: [registry],
  });
  const ticketShare = new Gauge({
    name: 'interfold_ticket_share',
    help: "Operator's share of total network tickets, percent (0-100)",
    registers: [registry],
  });
  const requestsPaused = new Gauge({
    name: 'interfold_requests_paused',
    help: '1 if the coordinator has E3 requests paused, else 0',
    registers: [registry],
  });
  const e3Total = new Gauge({
    name: 'interfold_e3_total',
    help: 'Total E3 requests seen so far',
    registers: [registry],
  });
  const e3ByStage = new Gauge({
    name: 'interfold_e3_by_stage',
    help: 'E3 count by lifecycle stage',
    labelNames: ['stage'],
    registers: [registry],
  });
  const rpcUp = new Gauge({
    name: 'interfold_rpc_up',
    help: '1 if the last RPC call succeeded, else 0',
    registers: [registry],
  });
  const lastBlock = new Gauge({
    name: 'interfold_last_block',
    help: 'Last block number observed',
    registers: [registry],
  });
  const releaseLatestInfo = new Gauge({
    name: 'interfold_release_latest_info',
    help: 'Always 1; the `tag` label carries the latest interfold release tag (Prometheus info-metric pattern)',
    labelNames: ['tag'],
    registers: [registry],
  });
  const localVersionInfo = new Gauge({
    name: 'interfold_local_version_info',
    help: 'Always 1; the `tag` label carries the locally installed interfold version. Absent if no local binary was found',
    labelNames: ['tag'],
    registers: [registry],
  });
  const updateAvailable = new Gauge({
    name: 'interfold_update_available',
    help: '1 if the local interfold binary is behind the latest release, else 0. Always 0 if no local binary was found',
    registers: [registry],
  });

  function update(report: NodeStatusReport): void {
    operatorRegistered.set(report.operator.registered ? 1 : 0);
    operatorActive.set(report.operator.active ? 1 : 0);
    operatorBondFold.set(report.operator.bondFold);
    operatorTickets.set(report.operator.tickets);
    networkTickets.set(report.network.totalTickets);
    ticketShare.set(report.network.ticketSharePercent);
    requestsPaused.set(report.protocol.requestsPaused ? 1 : 0);
    e3Total.set(report.protocol.e3Total);

    e3ByStage.set({ stage: E3_STAGE_NAMES[E3Stage.Requested] }, report.protocol.e3ByStage.requested);
    e3ByStage.set(
      { stage: E3_STAGE_NAMES[E3Stage.CommitteeFinalized] },
      report.protocol.e3ByStage.committeeFinalized,
    );
    e3ByStage.set({ stage: E3_STAGE_NAMES[E3Stage.KeyPublished] }, report.protocol.e3ByStage.keyPublished);
    e3ByStage.set(
      { stage: E3_STAGE_NAMES[E3Stage.CiphertextReady] },
      report.protocol.e3ByStage.ciphertextReady,
    );
    e3ByStage.set({ stage: E3_STAGE_NAMES[E3Stage.Complete] }, report.protocol.e3ByStage.complete);
    e3ByStage.set({ stage: E3_STAGE_NAMES[E3Stage.Failed] }, report.protocol.e3ByStage.failed);

    rpcUp.set(1);
    lastBlock.set(Number(report.chainInfo.blockNumber));
  }

  function markRpcDown(): void {
    rpcUp.set(0);
  }

  function updateRelease(info: ReleaseInfo): void {
    releaseLatestInfo.reset();
    if (info.latestTag) {
      releaseLatestInfo.set({ tag: info.latestTag }, 1);
    }

    localVersionInfo.reset();
    if (info.localVersion) {
      localVersionInfo.set({ tag: info.localVersion }, 1);
    }

    updateAvailable.set(info.updateAvailable ? 1 : 0);
  }

  return { registry, rpcUp, update, markRpcDown, updateRelease };
}
