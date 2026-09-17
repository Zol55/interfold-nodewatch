/** Converts an 18-decimals wei bigint to a whole-token number (truncated, not rounded). */
export function weiToWholeTokens(raw: bigint, decimals = 18): number {
  const divisor = 10n ** BigInt(decimals);
  return Number(raw / divisor);
}

/** Ticket count implied by a raw tFOLD balance and the current ticket price (both wei). */
export function ticketsFromBalance(ticketBalanceRaw: bigint, ticketPriceRaw: bigint): number {
  if (ticketPriceRaw === 0n) return 0;
  return Number(ticketBalanceRaw / ticketPriceRaw);
}

/**
 * Network-wide ticket count implied by the ticket token's total supply and
 * the current ticket price (both wei, same decimals).
 */
export function totalTicketsFromSupply(totalSupplyRaw: bigint, ticketPriceRaw: bigint): number {
  if (ticketPriceRaw === 0n) return 0;
  return Number(totalSupplyRaw / ticketPriceRaw);
}

/**
 * This operator's share of total network tickets, as a percentage (0-100).
 * Uses integer math scaled by 10_000 internally to avoid floating point on
 * the bigint inputs, then divides down to a JS number with two decimals.
 */
export function computeTicketSharePercent(myTickets: number, totalTickets: number): number {
  if (totalTickets <= 0) return 0;
  const scaled = Math.round((myTickets / totalTickets) * 10_000);
  return scaled / 100;
}

export function formatFold(raw: bigint): string {
  return weiToWholeTokens(raw, 18).toLocaleString('en-US');
}
