import type { Alert } from './alerts.js';
import { isNewer } from './semver.js';

/**
 * Pure check: has the latest published interfold release changed since the
 * last time we looked? `previousTag` is whatever was stored in state.json
 * from the prior check (null if this is the very first check ever -- in
 * that case there is nothing to compare against, so no alert, just a
 * baseline to compare future checks against).
 */
export function checkNewReleaseAlert(previousTag: string | null, currentTag: string, url: string): Alert | null {
  if (previousTag === null) return null;
  if (previousTag === currentTag) return null;
  return {
    severity: 'info',
    message: `New interfold release: ${currentTag} (${url})`,
  };
}

/**
 * Pure check: is the locally installed `interfold` binary behind the latest
 * release? Fires at most once per distinct latest version -- callers pass
 * in `lastAlertedVersion` (the latest version we already alerted about, or
 * null) and get back whether to alert plus what to store as the new
 * `lastAlertedVersion` for next time.
 */
export function checkUpdateAvailableAlert(
  localVersion: string | null,
  latestVersion: string,
  latestTag: string,
  releaseUrl: string,
  lastAlertedVersion: string | null,
): { alert: Alert | null; nextAlertedVersion: string | null } {
  if (localVersion === null) {
    return { alert: null, nextAlertedVersion: lastAlertedVersion };
  }

  if (!isNewer(latestVersion, localVersion)) {
    // Up to date (or ahead, e.g. running an unreleased build): clear any
    // stale "already alerted" marker so a future regression alerts again.
    return { alert: null, nextAlertedVersion: null };
  }

  if (lastAlertedVersion === latestVersion) {
    return { alert: null, nextAlertedVersion: lastAlertedVersion };
  }

  return {
    alert: {
      severity: 'warning',
      message: `Update available: local v${localVersion} -> latest ${latestTag} (${releaseUrl})`,
    },
    nextAlertedVersion: latestVersion,
  };
}
