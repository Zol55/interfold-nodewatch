/** Strips a leading "v" and surrounding whitespace: "v0.15.0" / "0.15.0" -> "0.15.0". */
export function normalizeVersion(raw: string): string {
  return raw.trim().replace(/^v/i, '');
}

export interface Semver {
  major: number;
  minor: number;
  patch: number;
}

/** Parses "x.y.z" (ignoring any pre-release/build suffix after it). Returns null if unparseable. */
export function parseSemver(raw: string): Semver | null {
  const normalized = normalizeVersion(raw);
  const match = /^(\d+)\.(\d+)\.(\d+)/.exec(normalized);
  if (!match) return null;
  return {
    major: Number(match[1]),
    minor: Number(match[2]),
    patch: Number(match[3]),
  };
}

/** Returns -1 if a<b, 0 if equal, 1 if a>b. Unparseable versions sort as lower than any parseable one. */
export function compareSemver(a: string, b: string): number {
  const pa = parseSemver(a);
  const pb = parseSemver(b);
  if (!pa && !pb) return 0;
  if (!pa) return -1;
  if (!pb) return 1;

  if (pa.major !== pb.major) return pa.major < pb.major ? -1 : 1;
  if (pa.minor !== pb.minor) return pa.minor < pb.minor ? -1 : 1;
  if (pa.patch !== pb.patch) return pa.patch < pb.patch ? -1 : 1;
  return 0;
}

/** True if `a` is strictly newer than `b`. */
export function isNewer(a: string, b: string): boolean {
  return compareSemver(a, b) > 0;
}
