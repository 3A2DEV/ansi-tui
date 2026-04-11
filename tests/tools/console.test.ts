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
        pattern: 'all',
        inventory: 'hosts.ini',
        limit: 'web',
        become: true,
        becomeUser: 'root',
        modulePath: './library',
        vaultPasswordFile: '.vault-pass',
        forks: '10',
        extraVars: 'env=dev',
        verbosity: '-vv',
        vaultId: 'dev@prompt',
        askVaultPass: true,
        askBecomePass: true,
        askPass: true,
        becomeMethod: 'sudo',
        remoteUser: 'ansible',
        connection: 'ssh',
        timeout: '10',
        privateKey: '~/.ssh/id_rsa',
        playbookDir: '.',
        taskTimeout: '30',
        step: true,
        check: true,
        diff: true,
        flushCache: true,
        listHosts: true,
      });

      expect(cmd).toContain('all');
      expect(cmd).toContain('--become-method');
      expect(cmd).toContain('-k');
      expect(cmd).toContain('-K');
      expect(cmd).toContain('-J');
      expect(cmd).toContain('-f');
      expect(cmd).toContain('-e');
      expect(cmd).toContain('-vv');
      expect(cmd).toContain('--vault-id');
      expect(cmd).toContain('-u');
      expect(cmd).toContain('-c');
      expect(cmd).toContain('-T');
      expect(cmd).toContain('--private-key');
      expect(cmd).toContain('--playbook-dir');
      expect(cmd).toContain('--task-timeout');
      expect(cmd).toContain('--step');
      expect(cmd).toContain('-C');
      expect(cmd).toContain('-D');
      expect(cmd).toContain('--flush-cache');
      expect(cmd).toContain('--list-hosts');
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

    it('returns pattern and task timeout fields', () => {
      const schema = tool.getParamSchema('start');

      expect(schema.find((field) => field.key === 'pattern')).toBeTruthy();
      expect(schema.find((field) => field.key === 'taskTimeout')).toBeTruthy();
    });
  });
});
