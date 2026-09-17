import type { NodeStatusReport } from '../types.js';
import { E3_STAGE_NAMES, E3Stage } from '../chain/abi/coordinator.js';

/** For fields where `true` is the healthy state (Registered, Active). */
function healthyLabel(value: boolean): string {
  return value ? 'OK' : 'FAIL';
}

/** For plain yes/no fields with no inherent "good" direction. */
function yesNoLabel(value: boolean): string {
  return value ? 'Yes' : 'No';
}

function line(label: string, value: string): string {
  return `${label.padEnd(24)} ${value}`;
}

export function formatStatusTable(report: NodeStatusReport): string {
  const { operator, network, protocol, chainInfo } = report;
  const rows: string[] = [];

  rows.push('Operator');
  rows.push(line('  Address', operator.address));
  rows.push(line('  Registered', healthyLabel(operator.registered)));
  rows.push(line('  Active', healthyLabel(operator.active)));
  rows.push(line('  Bond', `${operator.bondFold.toLocaleString('en-US')} FOLD`));
  rows.push(
    line(
      '  Tickets',
      `${operator.tickets} (min ${network.minTicketBalance.toString()} required to stay registered)`,
    ),
  );
  rows.push(line('  Bond owner', operator.bondOwner));
  rows.push(line('  Exit in progress', yesNoLabel(operator.hasExitInProgress)));
  rows.push('');

  rows.push('Network');
  rows.push(line('  Total tickets', network.totalTickets.toLocaleString('en-US')));
  rows.push(line('  Registered operators', network.registeredOperators.toString()));
  rows.push(line('  Active operators', network.activeOperators.toString()));
  rows.push(line('  Our ticket share', `${network.ticketSharePercent}%`));
  rows.push('');

  rows.push('Protocol');
  rows.push(line('  Requests paused', yesNoLabel(protocol.requestsPaused)));
  rows.push(
    line(
      '  E3 total',
      protocol.e3ScanLimitReached ? `${protocol.e3Total}+ (scan limit reached)` : String(protocol.e3Total),
    ),
  );
  if (protocol.e3Total === 0) {
    rows.push(line('  E3 by stage', 'no E3s requested yet'));
  } else {
    const byStage = protocol.e3ByStage;
    const parts = [
      `${E3_STAGE_NAMES[E3Stage.Requested]}=${byStage.requested}`,
      `${E3_STAGE_NAMES[E3Stage.CommitteeFinalized]}=${byStage.committeeFinalized}`,
      `${E3_STAGE_NAMES[E3Stage.KeyPublished]}=${byStage.keyPublished}`,
      `${E3_STAGE_NAMES[E3Stage.CiphertextReady]}=${byStage.ciphertextReady}`,
      `${E3_STAGE_NAMES[E3Stage.Complete]}=${byStage.complete}`,
      `${E3_STAGE_NAMES[E3Stage.Failed]}=${byStage.failed}`,
    ];
    rows.push(line('  E3 by stage', parts.join(', ')));
  }
  rows.push('');

  rows.push('Chain');
  rows.push(line('  Network', chainInfo.chain));
  rows.push(line('  Block', chainInfo.blockNumber.toString()));
  rows.push(line('  RPC latency', `${chainInfo.rpcLatencyMs} ms`));

  return rows.join('\n');
}

/** JSON-safe report: bigints become decimal strings. */
export function toJsonSafe(report: NodeStatusReport): Record<string, unknown> {
  return {
    operator: {
      ...report.operator,
      bondRaw: report.operator.bondRaw.toString(),
      ticketBalanceRaw: report.operator.ticketBalanceRaw.toString(),
    },
    network: {
      ...report.network,
      ticketPriceRaw: report.network.ticketPriceRaw.toString(),
      requiredBondRaw: report.network.requiredBondRaw.toString(),
      minTicketBalance: report.network.minTicketBalance.toString(),
    },
    protocol: report.protocol,
    chainInfo: {
      ...report.chainInfo,
      blockNumber: report.chainInfo.blockNumber.toString(),
    },
    fetchedAt: report.fetchedAt,
  };
}
