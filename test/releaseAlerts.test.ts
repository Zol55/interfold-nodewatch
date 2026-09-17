import { describe, it, expect } from 'vitest';
import { checkNewReleaseAlert, checkUpdateAvailableAlert } from '../src/core/releaseAlerts.js';

describe('checkNewReleaseAlert', () => {
  it('stays silent on the very first check (nothing to compare against yet)', () => {
    expect(checkNewReleaseAlert(null, 'v0.15.0', 'https://example.com/v0.15.0')).toBeNull();
  });

  it('stays silent when the tag is unchanged', () => {
    expect(checkNewReleaseAlert('v0.15.0', 'v0.15.0', 'https://example.com/v0.15.0')).toBeNull();
  });

  it('alerts exactly once when a new tag appears', () => {
    const alert = checkNewReleaseAlert('v0.14.0', 'v0.15.0', 'https://example.com/v0.15.0');
    expect(alert).not.toBeNull();
    expect(alert?.severity).toBe('info');
    expect(alert?.message).toMatch(/v0\.15\.0/);
    expect(alert?.message).toMatch(/https:\/\/example\.com\/v0\.15\.0/);

    // Simulating the next tick with the same tag stored: silent again.
    const nextTick = checkNewReleaseAlert('v0.15.0', 'v0.15.0', 'https://example.com/v0.15.0');
    expect(nextTick).toBeNull();
  });
});

describe('checkUpdateAvailableAlert', () => {
  const URL = 'https://example.com/v0.15.0';

  it('does nothing when no local binary is installed', () => {
    const { alert, nextAlertedVersion } = checkUpdateAvailableAlert(null, '0.15.0', 'v0.15.0', URL, null);
    expect(alert).toBeNull();
    expect(nextAlertedVersion).toBeNull();
  });

  it('does nothing when local is already up to date', () => {
    const { alert, nextAlertedVersion } = checkUpdateAvailableAlert('0.15.0', '0.15.0', 'v0.15.0', URL, null);
    expect(alert).toBeNull();
    expect(nextAlertedVersion).toBeNull();
  });

  it('alerts once when local is behind, then stays silent for the same latest version', () => {
    const first = checkUpdateAvailableAlert('0.13.0', '0.15.0', 'v0.15.0', URL, null);
    expect(first.alert).not.toBeNull();
    expect(first.alert?.severity).toBe('warning');
    expect(first.alert?.message).toMatch(/local v0\.13\.0/);
    expect(first.alert?.message).toMatch(/v0\.15\.0/);
    expect(first.nextAlertedVersion).toBe('0.15.0');

    const second = checkUpdateAvailableAlert('0.13.0', '0.15.0', 'v0.15.0', URL, first.nextAlertedVersion);
    expect(second.alert).toBeNull();
    expect(second.nextAlertedVersion).toBe('0.15.0');
  });

  it('alerts again if an even newer release appears while still behind', () => {
    const { alert, nextAlertedVersion } = checkUpdateAvailableAlert(
      '0.13.0',
      '0.16.0',
      'v0.16.0',
      'https://example.com/v0.16.0',
      '0.15.0', // already alerted for 0.15.0
    );
    expect(alert).not.toBeNull();
    expect(nextAlertedVersion).toBe('0.16.0');
  });

  it('clears the alerted marker once local catches up', () => {
    const { alert, nextAlertedVersion } = checkUpdateAvailableAlert('0.15.0', '0.15.0', 'v0.15.0', URL, '0.15.0');
    expect(alert).toBeNull();
    expect(nextAlertedVersion).toBeNull();
  });
});
