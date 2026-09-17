import { describe, it, expect, vi } from 'vitest';
import type { PublicClient } from 'viem';
import { fetchOperatorStatus, fetchNetworkInfo } from '../src/core/status.js';
import { CONTRACT_ADDRESSES } from '../src/chain/addresses.js';

const OPERATOR = '0xYourOperatorAddress0000000000000000001' as const;

/**
 * Minimal mock of viem's PublicClient.readContract, routed by functionName.
 * Values mirror the real mainnet numbers nodewatch was verified against on
 * 2026-09-17 (registered=true, active=true, 2 tickets, 32000 FOLD bond,
 * ticketPrice=1000 tFOLD, tFOLD totalSupply=61000).
 */
function mockClient(overrides: Record<string, unknown> = {}): PublicClient {
  const responses: Record<string, unknown> = {
    isRegistered: true,
    isActive: true,
    bondOwnerOf: '0x000000000000000000000000000000000000aa',
    hasExitInProgress: false,
    getCiphernodeBond: 32_000n * 10n ** 18n,
    getTicketBalance: 2_000n * 10n ** 18n,
    availableTickets: 2n,
    ticketPrice: 1_000n * 10n ** 18n,
    requiredCiphernodeBond: 32_000n * 10n ** 18n,
    minTicketBalance: 1n,
    numRegisteredOperators: 24n,
    numActiveOperators: 22n,
    totalSupply: 61_000n * 10n ** 18n,
    ...overrides,
  };

  return {
    readContract: vi.fn(async ({ functionName }: { functionName: string }) => {
      if (!(functionName in responses)) {
        throw new Error(`mockClient: no response configured for ${functionName}`);
      }
      return responses[functionName];
    }),
  } as unknown as PublicClient;
}

describe('fetchOperatorStatus (mocked client)', () => {
  it('maps raw contract reads to a status object with derived fields', async () => {
    const client = mockClient();
    const status = await fetchOperatorStatus(client, CONTRACT_ADDRESSES.mainnet, OPERATOR);

    expect(status.registered).toBe(true);
    expect(status.active).toBe(true);
    expect(status.tickets).toBe(2);
    expect(status.bondFold).toBe(32_000);
    expect(status.bondRaw).toBe(32_000n * 10n ** 18n);
  });

  it('reflects a deregistered/inactive operator', async () => {
    const client = mockClient({ isRegistered: false, isActive: false });
    const status = await fetchOperatorStatus(client, CONTRACT_ADDRESSES.mainnet, OPERATOR);

    expect(status.registered).toBe(false);
    expect(status.active).toBe(false);
  });
});

describe('fetchNetworkInfo (mocked client)', () => {
  it('computes total network tickets and our share from the mocked ticket token supply', async () => {
    const client = mockClient();
    const network = await fetchNetworkInfo(client, CONTRACT_ADDRESSES.mainnet, 2);

    expect(network.totalTickets).toBe(61);
    expect(network.registeredOperators).toBe(24);
    expect(network.activeOperators).toBe(22);
    expect(network.ticketSharePercent).toBeCloseTo((2 / 61) * 100, 2);
  });
});
