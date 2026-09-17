import { resolveConfig, requireOperator } from '../config.js';
import { CONTRACT_ADDRESSES } from '../chain/addresses.js';
import { createClient } from '../chain/client.js';
import { fetchFullStatus } from '../core/status.js';
import { formatStatusTable, toJsonSafe } from '../core/format.js';

export interface StatusCommandOptions {
  operator?: string;
  json?: boolean;
  rpcUrl?: string;
  chain?: string;
}

export async function runStatus(options: StatusCommandOptions): Promise<void> {
  const config = resolveConfig({
    rpcUrl: options.rpcUrl,
    chain: options.chain,
    operator: options.operator,
  });
  const operator = requireOperator(config);
  const addresses = CONTRACT_ADDRESSES[config.chain];
  const client = createClient(config.rpcUrl, config.chain);

  const report = await fetchFullStatus(client, addresses, operator, config.chain);

  if (options.json) {
    console.log(JSON.stringify(toJsonSafe(report), null, 2));
  } else {
    console.log(formatStatusTable(report));
  }
}
