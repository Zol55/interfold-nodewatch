import type { Address } from 'viem';

export interface OperatorStatus {
  address: Address;
  registered: boolean;
  active: boolean;
  bondOwner: Address;
  hasExitInProgress: boolean;
  /** Raw FOLD bond, in wei (18 decimals). */
  bondRaw: bigint;
  /** Bond formatted as whole FOLD (integer, truncated). */
  bondFold: number;
  /** Raw tFOLD ticket balance, in wei (18 decimals). */
  ticketBalanceRaw: bigint;
  /** Ticket count derived from availableTickets(operator) on-chain. */
  tickets: number;
}

export interface NetworkInfo {
  ticketPriceRaw: bigint;
  requiredBondRaw: bigint;
  minTicketBalance: bigint;
  registeredOperators: number;
  activeOperators: number;
  /** tFOLD.totalSupply() / ticketPrice, i.e. total tickets network-wide. */
  totalTickets: number;
  /** This operator's tickets as a percentage of totalTickets, 0-100. */
  ticketSharePercent: number;
}

export interface E3StageCounts {
  requested: number;
  committeeFinalized: number;
  keyPublished: number;
  ciphertextReady: number;
  complete: number;
  failed: number;
}

export interface ProtocolInfo {
  requestsPaused: boolean;
  /** Highest requested E3 id + 1, found by walking getE3Stage from 0. */
  e3Total: number;
  e3ByStage: E3StageCounts;
  /** True if the scan hit its cap before finding an unrequested id. */
  e3ScanLimitReached: boolean;
}

export interface ChainInfo {
  chain: 'mainnet' | 'sepolia';
  blockNumber: bigint;
  rpcLatencyMs: number;
}

export interface NodeStatusReport {
  operator: OperatorStatus;
  network: NetworkInfo;
  protocol: ProtocolInfo;
  chainInfo: ChainInfo;
  fetchedAt: string;
}
