/**
 * Minimal BondingRegistry ABI: only the getters and events nodewatch reads.
 *
 * Verified against the mainnet proxy (0x0ec9...2915F) via Sourcify
 * ("match": "match" for the implementation at 0xd89D...cCA53a) and by live
 * eth_call against https://ethereum-rpc.publicnode.com on 2026-09-17.
 */
export const bondingRegistryAbi = [
  {
    name: 'isRegistered',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'operator', type: 'address' }],
    outputs: [{ type: 'bool' }],
  },
  {
    name: 'isActive',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'operator', type: 'address' }],
    outputs: [{ type: 'bool' }],
  },
  {
    name: 'getTicketBalance',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'operator', type: 'address' }],
    outputs: [{ type: 'uint256' }],
  },
  {
    name: 'availableTickets',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'operator', type: 'address' }],
    outputs: [{ type: 'uint256' }],
  },
  {
    name: 'getCiphernodeBond',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'operator', type: 'address' }],
    outputs: [{ type: 'uint256' }],
  },
  {
    name: 'bondOwnerOf',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'operator', type: 'address' }],
    outputs: [{ type: 'address' }],
  },
  {
    name: 'hasExitInProgress',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'operator', type: 'address' }],
    outputs: [{ type: 'bool' }],
  },
  {
    name: 'ticketPrice',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ type: 'uint256' }],
  },
  {
    name: 'requiredCiphernodeBond',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ type: 'uint256' }],
  },
  {
    name: 'minTicketBalance',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ type: 'uint256' }],
  },
  {
    name: 'numRegisteredOperators',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ type: 'uint256' }],
  },
  {
    name: 'numActiveOperators',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ type: 'uint256' }],
  },
  {
    name: 'ticketToken',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ type: 'address' }],
  },
  {
    name: 'ciphernodeBondToken',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ type: 'address' }],
  },
  {
    name: 'OperatorActivationChanged',
    type: 'event',
    inputs: [
      { name: 'operator', type: 'address', indexed: true },
      { name: 'active', type: 'bool', indexed: false },
    ],
  },
  {
    name: 'TicketBalanceUpdated',
    type: 'event',
    inputs: [
      { name: 'operator', type: 'address', indexed: true },
      { name: 'delta', type: 'int256', indexed: false },
      { name: 'newBalance', type: 'uint256', indexed: false },
      { name: 'reason', type: 'bytes32', indexed: true },
    ],
  },
  {
    name: 'CiphernodeBondUpdated',
    type: 'event',
    inputs: [
      { name: 'operator', type: 'address', indexed: true },
      { name: 'delta', type: 'int256', indexed: false },
      { name: 'newBond', type: 'uint256', indexed: false },
      { name: 'reason', type: 'bytes32', indexed: true },
    ],
  },
  {
    name: 'PendingAssetsSlashed',
    type: 'event',
    inputs: [
      { name: 'operator', type: 'address', indexed: true },
      { name: 'ticketAmount', type: 'uint256', indexed: false },
      { name: 'ciphernodeBondAmount', type: 'uint256', indexed: false },
      { name: 'includedLockedAssets', type: 'bool', indexed: false },
    ],
  },
  {
    name: 'AssetsQueuedForExit',
    type: 'event',
    inputs: [
      { name: 'operator', type: 'address', indexed: true },
      { name: 'ticketAmount', type: 'uint256', indexed: false },
      { name: 'ciphernodeBondAmount', type: 'uint256', indexed: false },
      { name: 'unlockTimestamp', type: 'uint64', indexed: false },
    ],
  },
  {
    name: 'AssetsClaimed',
    type: 'event',
    inputs: [
      { name: 'operator', type: 'address', indexed: true },
      { name: 'ticketAmount', type: 'uint256', indexed: false },
      { name: 'ciphernodeBondAmount', type: 'uint256', indexed: false },
    ],
  },
  {
    name: 'CiphernodeDeregistrationRequested',
    type: 'event',
    inputs: [
      { name: 'operator', type: 'address', indexed: true },
      { name: 'unlockAt', type: 'uint64', indexed: false },
    ],
  },
  {
    name: 'CommitteeObligationUpdated',
    type: 'event',
    inputs: [
      { name: 'e3Id', type: 'uint256', indexed: true },
      { name: 'registry', type: 'address', indexed: true },
      { name: 'operator', type: 'address', indexed: true },
      { name: 'active', type: 'bool', indexed: false },
    ],
  },
] as const;
