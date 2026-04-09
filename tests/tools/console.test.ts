import { describe, it, expect } from 'vitest';
import { ConsoleTool } from '../../src/tools/console.js';

describe('ConsoleTool', () => {
  const tool = new ConsoleTool();

  it('has correct name', () => {
    expect(tool.name).toBe('ansible-console');
  });

  it('returns the start action', () => {
    expect(tool.getActions()).toEqual(['start']);
  });

  describe('buildCommand', () => {
    it('builds console command with all supported flags', () => {
      const cmd = tool.buildCommand({
        action: 'start',
        inventory: 'hosts.ini',
        limit: 'web',
        become: true,
        becomeUser: 'root',
        modulePath: './library',
        vaultPasswordFile: '.vault-pass',
      });

      expect(cmd).toEqual([
        'ansible-console',
        '-i',
        'hosts.ini',
        '--limit',
        'web',
        '--become',
        '--become-user',
        'root',
        '-M',
        './library',
        '--vault-password-file',
        '.vault-pass',
      ]);
    });
  });

  describe('validate', () => {
    it('returns no errors for empty params', () => {
      expect(tool.validate({ action: 'start' })).toHaveLength(0);
    });
  });

  describe('getParamSchema', () => {
    it('returns inventory and vault password fields', () => {
      const schema = tool.getParamSchema('start');

      expect(schema.find((field) => field.key === 'inventory')?.isPath).toBe(true);
      expect(schema.find((field) => field.key === 'vaultPasswordFile')?.type).toBe('file');
    });
  });
});
