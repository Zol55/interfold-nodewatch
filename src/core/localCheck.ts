import { exec } from 'node:child_process';
import { promisify } from 'node:util';
import type { Alert } from './alerts.js';

const execAsync = promisify(exec);

/**
 * Best-effort parser for `interfold ciphernode status` output. The exact
 * format of that command is not documented publicly, so this looks for
 * "Registered" / "Active" followed by a boolean-ish token on the same line
 * and ignores anything else. Returns null fields it could not find.
 */
export function parseLocalStatus(output: string): { registered: boolean | null; active: boolean | null } {
  const registeredMatch = /registered\s*[:=]?\s*(true|false|yes|no)/i.exec(output);
  const activeMatch = /active\s*[:=]?\s*(true|false|yes|no)/i.exec(output);

  const toBool = (token: string | undefined): boolean | null => {
    if (!token) return null;
    return /^(true|yes)$/i.test(token);
  };

  return {
    registered: toBool(registeredMatch?.[1]),
    active: toBool(activeMatch?.[1]),
  };
}

/**
 * Runs `interfold ciphernode status` locally and compares it against the
 * on-chain values already fetched for this tick. Alerts if the command
 * fails outright, or if it reports a Registered/Active value that
 * disagrees with the chain.
 */
export async function checkLocalAgainstChain(
  onChainRegistered: boolean,
  onChainActive: boolean,
): Promise<Alert[]> {
  const alerts: Alert[] = [];

  let stdout: string;
  try {
    const result = await execAsync('interfold ciphernode status', { timeout: 15_000 });
    stdout = result.stdout;
  } catch (err) {
    alerts.push({
      severity: 'critical',
      message: `--local: \`interfold ciphernode status\` failed: ${err instanceof Error ? err.message : String(err)}`,
    });
    return alerts;
  }

  const local = parseLocalStatus(stdout);

  if (local.registered !== null && local.registered !== onChainRegistered) {
    alerts.push({
      severity: 'critical',
      message: `--local: local Registered=${local.registered} disagrees with chain Registered=${onChainRegistered}`,
    });
  }
  if (local.active !== null && local.active !== onChainActive) {
    alerts.push({
      severity: 'critical',
      message: `--local: local Active=${local.active} disagrees with chain Active=${onChainActive}`,
    });
  }

  return alerts;
}
