import { describe, it, expect } from 'vitest';
import { normalizeVersion, compareSemver, isNewer } from '../src/core/semver.js';

describe('normalizeVersion', () => {
  it('strips a leading v', () => {
    expect(normalizeVersion('v0.15.0')).toBe('0.15.0');
  });

  it('leaves a bare version alone', () => {
    expect(normalizeVersion('0.13.0')).toBe('0.13.0');
  });
});

describe('compareSemver / isNewer', () => {
  it('matches the real interfold releases observed on 2026-09-17: v0.15.0 > v0.14.0 > v0.13.0', () => {
    expect(isNewer('v0.15.0', 'v0.14.0')).toBe(true);
    expect(isNewer('v0.14.0', 'v0.13.0')).toBe(true);
    expect(isNewer('v0.13.0', 'v0.15.0')).toBe(false);
  });

  it('is insensitive to a leading v on either side', () => {
    expect(isNewer('v0.15.0', '0.13.0')).toBe(true);
    expect(isNewer('0.15.0', 'v0.13.0')).toBe(true);
  });

  it('treats equal versions as not newer', () => {
    expect(isNewer('0.15.0', 'v0.15.0')).toBe(false);
    expect(compareSemver('0.15.0', 'v0.15.0')).toBe(0);
  });

  it('compares patch versions correctly (not lexicographically)', () => {
    expect(isNewer('0.12.10', '0.12.9')).toBe(true);
  });
});
