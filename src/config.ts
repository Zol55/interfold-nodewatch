import type { Address } from 'viem';
import { isAddress } from 'viem';
import type { ChainName } from './chain/addresses.js';

export const DEFAULT_RPC_URL = 'https://ethereum-rpc.publicnode.com';
export const DEFAULT_POLL_INTERVAL_SECONDS = 60;
export const DEFAULT_EXPORTER_PORT = 9464;
export const DEFAULT_RELEASE_CHECK_MINUTES = 60;

export interface ResolvedConfig {
  rpcUrl: string;
  chain: ChainName;
  operatorAddress: Address | undefined;
  telegramBotToken: string | undefined;
  telegramChatId: string | undefined;
  pollIntervalSeconds: number;
  exporterPort: number;
  releaseCheckMinutes: number;
}

export interface ConfigOverrides {
  rpcUrl?: string;
  chain?: string;
  operator?: string;
  pollIntervalSeconds?: number;
  exporterPort?: number;
  releaseCheckMinutes?: number;
}

function parseChain(value: string | undefined): ChainName {
  if (value === 'sepolia') return 'sepolia';
  return 'mainnet';
}

/** CLI flags always win over environment variables. */
export function resolveConfig(overrides: ConfigOverrides = {}): ResolvedConfig {
  const rpcUrl = overrides.rpcUrl ?? process.env.RPC_URL ?? DEFAULT_RPC_URL;
  const chain = parseChain(overrides.chain ?? process.env.CHAIN);

  const rawOperator = overrides.operator ?? process.env.OPERATOR_ADDRESS;
  let operatorAddress: Address | undefined;
  if (rawOperator) {
    if (!isAddress(rawOperator)) {
      throw new Error(`Not a valid address: "${rawOperator}" (--operator or OPERATOR_ADDRESS)`);
    }
    operatorAddress = rawOperator;
  }

  const pollIntervalSeconds =
    overrides.pollIntervalSeconds ??
    (process.env.POLL_INTERVAL ? Number(process.env.POLL_INTERVAL) : undefined) ??
    DEFAULT_POLL_INTERVAL_SECONDS;

  const exporterPort =
    overrides.exporterPort ??
    (process.env.EXPORTER_PORT ? Number(process.env.EXPORTER_PORT) : undefined) ??
    DEFAULT_EXPORTER_PORT;

  const releaseCheckMinutes =
    overrides.releaseCheckMinutes ??
    (process.env.RELEASE_CHECK_MINUTES ? Number(process.env.RELEASE_CHECK_MINUTES) : undefined) ??
    DEFAULT_RELEASE_CHECK_MINUTES;

  return {
    rpcUrl,
    chain,
    operatorAddress,
    telegramBotToken: process.env.TELEGRAM_BOT_TOKEN,
    telegramChatId: process.env.TELEGRAM_CHAT_ID,
    pollIntervalSeconds,
    exporterPort,
    releaseCheckMinutes,
  };
}

export function requireOperator(config: ResolvedConfig): Address {
  if (!config.operatorAddress) {
    throw new Error(
      'No operator address given. Pass --operator 0x... or set OPERATOR_ADDRESS in the environment.',
    );
  }
  return config.operatorAddress;
}
