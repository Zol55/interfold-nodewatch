import { exec } from 'node:child_process';
import { promisify } from 'node:util';
import { compareSemver, normalizeVersion } from './semver.js';

const execAsync = promisify(exec);

export interface LatestRelease {
  tag: string;
  version: string;
  publishedAt: string | null;
  url: string;
}

interface GitHubRelease {
  tag_name: string;
  draft: boolean;
  prerelease: boolean;
  published_at: string | null;
  html_url: string;
}

interface GitHubTag {
  name: string;
}

const REPO = 'theinterfold/interfold';
const RELEASES_URL = `https://api.github.com/repos/${REPO}/releases?per_page=10`;
const TAGS_URL = `https://api.github.com/repos/${REPO}/tags?per_page=10`;

/**
 * Finds the latest interfold release.
 *
 * Deliberately does NOT use GET /repos/{repo}/releases/latest: for this repo
 * that endpoint returns an older tag (v0.13.0) than the highest actually
 * published (v0.15.0) -- GitHub picks "latest" by creation order among
 * releases, which does not always match semver order if releases were
 * published out of order. Instead this fetches the recent releases list,
 * drops drafts/prereleases, and picks the highest semver tag. Falls back to
 * the plain tags list (no publish date/release notes URL available there)
 * if the repo has no releases at all.
 */
export async function fetchLatestRelease(): Promise<LatestRelease | null> {
  const releasesRes = await fetch(RELEASES_URL, {
    headers: { Accept: 'application/vnd.github+json' },
  });
  if (!releasesRes.ok) {
    throw new Error(`GitHub releases API returned ${releasesRes.status}`);
  }
  const releases = (await releasesRes.json()) as GitHubRelease[];
  const eligible = releases.filter((r) => !r.draft && !r.prerelease);

  if (eligible.length > 0) {
    const best = eligible.reduce((a, b) =>
      compareSemver(normalizeVersion(b.tag_name), normalizeVersion(a.tag_name)) > 0 ? b : a,
    );
    return {
      tag: best.tag_name,
      version: normalizeVersion(best.tag_name),
      publishedAt: best.published_at,
      url: best.html_url,
    };
  }

  const tagsRes = await fetch(TAGS_URL, { headers: { Accept: 'application/vnd.github+json' } });
  if (!tagsRes.ok) {
    throw new Error(`GitHub tags API returned ${tagsRes.status}`);
  }
  const tags = (await tagsRes.json()) as GitHubTag[];
  if (tags.length === 0) return null;

  const bestTag = tags.reduce((a, b) =>
    compareSemver(normalizeVersion(b.name), normalizeVersion(a.name)) > 0 ? b : a,
  );
  return {
    tag: bestTag.name,
    version: normalizeVersion(bestTag.name),
    publishedAt: null,
    url: `https://github.com/${REPO}/releases/tag/${bestTag.name}`,
  };
}

/**
 * Runs `interfold --version` locally and parses its output (observed format:
 * "interfold 0.13.0", no leading "v"). Returns null if the binary isn't on
 * PATH or the command fails/produces unparseable output -- both treated the
 * same way ("not installed") so callers don't need to distinguish them.
 */
export async function getLocalVersion(): Promise<string | null> {
  try {
    const { stdout } = await execAsync('interfold --version', { timeout: 10_000 });
    const match = /(\d+\.\d+\.\d+)/.exec(stdout);
    return match ? match[1]! : null;
  } catch {
    return null;
  }
}
