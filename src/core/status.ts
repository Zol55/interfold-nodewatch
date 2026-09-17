import type { Address, PublicClient } from 'viem';
import { erc20Abi } from 'viem';
import type { ContractAddresses, ChainName } from '../chain/addresses.js';
import { bondingRegistryAbi } from '../chain/abi/bondingRegistry.js';
import { measureRpc } from '../chain/client.js';
import { computeTicketSharePercent, totalTicketsFromSupply, weiToWholeTokens } from './math.js';
import { scanE3Total } from './e3.js';
import type { NodeStatusReport, OperatorStatus, NetworkInfo, ChainInfo } from '../types.js';
import { coordinatorAbi } from '../chain/abi/coordinator.js';

export async function fetchOperatorStatus(
  client: PublicClient,
  addresses: ContractAddresses,
  operator: Address,
): Promise<OperatorStatus> {
  const registry = { address: addresses.bondingRegistry, abi: bondingRegistryAbi } as const;

  const [registered, active, bondOwner, hasExitInProgress, bondRaw, ticketBalanceRaw, tickets] =
    await Promise.all([
      client.readContract({ ...registry, functionName: 'isRegistered', args: [operator] }),
      client.readContract({ ...registry, functionName: 'isActive', args: [operator] }),
      client.readContract({ ...registry, functionName: 'bondOwnerOf', args: [operator] }),
      client.readContract({ ...registry, functionName: 'hasExitInProgress', args: [operator] }),
      client.readContract({ ...registry, functionName: 'getCiphernodeBond', args: [operator] }),
      client.readContract({ ...registry, functionName: 'getTicketBalance', args: [operator] }),
      client.readContract({ ...registry, functionName: 'availableTickets', args: [operator] }),
    ]);

  return {
    address: operator,
    registered,
    active,
    bondOwner,
    hasExitInProgress,
    bondRaw,
    bondFold: weiToWholeTokens(bondRaw, 18),
    ticketBalanceRaw,
    tickets: Number(tickets),
  };
}

export async function fetchNetworkInfo(
  client: PublicClient,
  addresses: ContractAddresses,
  myTickets: number,
): Promise<NetworkInfo> {
  const registry = { address: addresses.bondingRegistry, abi: bondingRegistryAbi } as const;
  const ticketToken = { address: addresses.tFold, abi: erc20Abi } as const;

  const [ticketPriceRaw, requiredBondRaw, minTicketBalance, registeredOperators, activeOperators, totalSupplyRaw] =
    await Promise.all([
      client.readContract({ ...registry, functionName: 'ticketPrice' }),
      client.readContract({ ...registry, functionName: 'requiredCiphernodeBond' }),
      client.readContract({ ...registry, functionName: 'minTicketBalance' }),
      client.readContract({ ...registry, functionName: 'numRegisteredOperators' }),
      client.readContract({ ...registry, functionName: 'numActiveOperators' }),
      client.readContract({ ...ticketToken, functionName: 'totalSupply' }),
    ]);

  const totalTickets = totalTicketsFromSupply(totalSupplyRaw, ticketPriceRaw);

  return {
    ticketPriceRaw,
    requiredBondRaw,
    minTicketBalance,
    registeredOperators: Number(registeredOperators),
    activeOperators: Number(activeOperators),
    totalTickets,
    ticketSharePercent: computeTicketSharePercent(myTickets, totalTickets),
  };
}

export async function fetchChainInfo(client: PublicClient, chain: ChainName): Promise<ChainInfo> {
  const { blockNumber, latencyMs } = await measureRpc(client);
  return { chain, blockNumber, rpcLatencyMs: latencyMs };
}

export interface FetchStatusOptions {
  e3ScanLimit?: number;
}

export async function fetchFullStatus(
  client: PublicClient,
  addresses: ContractAddresses,
  operator: Address,
  chain: ChainName,
  options: FetchStatusOptions = {},
): Promise<NodeStatusReport> {
  const operatorStatus = await fetchOperatorStatus(client, addresses, operator);
  const [network, chainInfo, protocol] = await Promise.all([
    fetchNetworkInfo(client, addresses, operatorStatus.tickets),
    fetchChainInfo(client, chain),
    (async () => {
      const requestsPaused = await client.readContract({
        address: addresses.coordinator,
        abi: coordinatorAbi,
        functionName: 'requestsPaused',
      });
      const { total, byStage, scanLimitReached } = await scanE3Total(
        client,
        addresses.coordinator,
        options.e3ScanLimit,
      );
      return {
        requestsPaused,
        e3Total: total,
        e3ByStage: byStage,
        e3ScanLimitReached: scanLimitReached,
      };
    })(),
  ]);

  return {
    operator: operatorStatus,
    network,
    protocol,
    chainInfo,
    fetchedAt: new Date().toISOString(),
  };
}
