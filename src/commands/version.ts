import { fetchLatestRelease, getLocalVersion } from '../core/release.js';
import { isNewer } from '../core/semver.js';

export async function runVersion(): Promise<void> {
  const latest = await fetchLatestRelease();
  const local = await getLocalVersion();

  if (!latest) {
    console.log('Could not determine the latest interfold release (no releases or tags found).');
  } else {
    console.log(`Latest interfold release: ${latest.tag}`);
    console.log(`  Published: ${latest.publishedAt ?? 'unknown'}`);
    console.log(`  URL:       ${latest.url}`);
  }

  console.log('');

  if (local === null) {
    console.log('Local `interfold` binary: not found on PATH.');
    return;
  }

  console.log(`Local interfold version: ${local}`);

  if (!latest) return;

  if (isNewer(latest.version, local)) {
    console.log(`\nUpdate available: local v${local} -> latest ${latest.tag}`);
  } else {
    console.log('\nUp to date.');
  }
}
