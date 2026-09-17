import { describe, expect, it } from 'vitest';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { loadDotEnv } from '../src/config.js';

describe('loadDotEnv', () => {
  it('loads KEY=value lines without overriding existing env', () => {
    const dir = mkdtempSync(join(tmpdir(), 'nodewatch-env-'));
    const file = join(dir, '.env');
    writeFileSync(file, '# comment\nRPC_URL="https://rpc.example"\nOPERATOR_ADDRESS=0xabc\nexport POLL_INTERVAL=15\nBROKEN LINE\n');
    const env: NodeJS.ProcessEnv = { OPERATOR_ADDRESS: '0xkeep' };
    const loaded = loadDotEnv(file, env);
    expect(loaded).toBe(2);
    expect(env.RPC_URL).toBe('https://rpc.example');
    expect(env.OPERATOR_ADDRESS).toBe('0xkeep');
    expect(env.POLL_INTERVAL).toBe('15');
  });

  it('returns 0 when the file does not exist', () => {
    expect(loadDotEnv('/nonexistent/.env', {})).toBe(0);
  });
});
