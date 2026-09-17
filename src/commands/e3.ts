import { resolveConfig } from '../config.js';
import { CONTRACT_ADDRESSES } from '../chain/addresses.js';
import { createClient } from '../chain/client.js';
import { fetchE3Details } from '../core/e3.js';
import { E3_STAGE_NAMES, FAILURE_REASON_NAMES, FailureReason } from '../chain/abi/coordinator.js';

export interface E3CommandOptions {
  rpcUrl?: string;
  chain?: string;
}

export async function runE3(idArg: string, options: E3CommandOptions): Promise<void> {
  const id = BigInt(idArg);
  const config = resolveConfig({ rpcUrl: options.rpcUrl, chain: options.chain });
  const addresses = CONTRACT_ADDRESSES[config.chain];
  const client = createClient(config.rpcUrl, config.chain);

  const details = await fetchE3Details(client, addresses.coordinator, id);

  if (!details) {
    console.log(`E3 #${id} does not exist yet (no E3s have been requested with this id).`);
    console.log('Tip: run `nodewatch status` to see the total E3 count and try a lower id.');
    return;
  }

  console.log(`E3 #${details.id}`);
  console.log(`  Stage:              ${E3_STAGE_NAMES[details.stage]}`);
  if (details.failureReason !== null) {
    console.log(
      `  Failure reason:     ${FAILURE_REASON_NAMES[details.failureReason as FailureReason] ?? details.failureReason}`,
    );
  }
  console.log(`  Requester:          ${details.requester}`);
  console.log(`  Committee size:     ${details.committeeSize}`);
  console.log(`  Request block:      ${details.requestBlock}`);
  console.log(`  E3 program:         ${details.e3Program}`);
  console.log(`  Committee key set:  ${details.committeePublicKeyPublished}`);
  console.log(`  Ciphertext ready:   ${details.ciphertextOutputPublished}`);
  console.log(`  Plaintext ready:    ${details.plaintextOutputPublished}`);
}
