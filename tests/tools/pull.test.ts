import { describe, it, expect } from 'vitest';
import { PullTool } from '../../src/tools/pull.js';

describe('PullTool', () => {
  const tool = new PullTool();

  describe('buildCommand', () => {
    it('passes URL without quote wrapping', () => {
      const url = 'https://github.com/org/repo.git';
      const cmd = tool.buildCommand({ action: 'pull', url });

      expect(cmd).toContain(url);
      expect(cmd).not.toContain(`"${url}"`);
    });

    it('omits url arg when not provided', () => {
      const cmd = tool.buildCommand({ action: 'pull' });
      expect(cmd.some((arg) => arg.startsWith('http'))).toBe(false);
    });
  });
});
