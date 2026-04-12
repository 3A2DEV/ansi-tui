import { describe, expect, it } from 'vitest';
import packageJson from '../../package.json';

describe('package metadata contract', () => {
  it('publishes only the intended allowlisted files', () => {
    expect(packageJson.files).toEqual([
      'dist',
      'README.md',
      'LICENSE',
      'CHANGELOG.md',
      'install.sh',
    ]);
  });

  it('exposes the ansi-tui bin entry', () => {
    expect(packageJson.bin).toEqual({
      'ansi-tui': './dist/index.js',
    });
  });

  it('defines public publish config for the scoped package', () => {
    expect(packageJson.publishConfig).toEqual({ access: 'public' });
  });

  it('defines package verification scripts', () => {
    expect(packageJson.scripts.typecheck).toBe('tsc --noEmit');
    expect(packageJson.scripts['pack:check']).toBe('npm pack --dry-run');
    expect(packageJson.scripts.verify).toBe('npm run typecheck && npm run lint && npm test && npm run build');
    expect(packageJson.scripts.prepack).toBe('npm run build');
  });
});
