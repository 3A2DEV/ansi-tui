import { describe, expect, it } from 'vitest';
import { getHelpText, getNonTtyMessage, getPackageVersion, resolveCliMode } from '../../src/cli.js';

describe('package cli contract', () => {
  it('resolves help mode from help flags', () => {
    expect(resolveCliMode(['--help'], false, false)).toBe('help');
    expect(resolveCliMode(['-h'], false, false)).toBe('help');
  });

  it('resolves version mode from version flags', () => {
    expect(resolveCliMode(['--version'], false, false)).toBe('version');
    expect(resolveCliMode(['-v'], false, false)).toBe('version');
  });

  it('resolves non-tty mode when stdin or stdout is not interactive', () => {
    expect(resolveCliMode([], false, true)).toBe('non-tty');
    expect(resolveCliMode([], true, false)).toBe('non-tty');
  });

  it('resolves run mode for interactive sessions without package flags', () => {
    expect(resolveCliMode([], true, true)).toBe('run');
  });

  it('returns help text with usage and options', () => {
    const helpText = getHelpText();
    expect(helpText).toContain('Usage:');
    expect(helpText).toContain('ansi-tui --help');
    expect(helpText).toContain('ansi-tui --version');
  });

  it('returns a non-tty message that points to help', () => {
    expect(getNonTtyMessage()).toContain('interactive TTY');
    expect(getNonTtyMessage()).toContain('--help');
  });

  it('reads package version from package.json', () => {
    expect(getPackageVersion()).toBe('0.1.0');
  });
});
