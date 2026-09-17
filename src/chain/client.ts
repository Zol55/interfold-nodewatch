import { createPublicClient, http, type PublicClient } from 'viem';
import { mainnet, sepolia } from 'viem/chains';
import type { ChainName } from './addresses.js';

export function chainFor(name: ChainName) {
  return name === 'sepolia' ? sepolia : mainnet;
}

export function createClient(rpcUrl: string, chainName: ChainName): PublicClient {
  return createPublicClient({
    chain: chainFor(chainName),
    transport: http(rpcUrl),
  });
}

/** Times a single RPC round trip (current block number) in milliseconds. */
export async function measureRpc(
  client: PublicClient,
): Promise<{ blockNumber: bigint; latencyMs: number }> {
  const start = Date.now();
  const blockNumber = await client.getBlockNumber();
  const latencyMs = Date.now() - start;
  return { blockNumber, latencyMs };
}
