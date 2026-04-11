import { describe, it, expect } from 'vitest';
import { InventoryTool } from '../../src/tools/inventory.js';

describe('InventoryTool', () => {
  const tool = new InventoryTool();

  it('has correct name', () => {
    expect(tool.name).toBe('ansible-inventory');
  });

  it('returns all actions', () => {
    const actions = tool.getActions();
    expect(actions).toContain('list');
    expect(actions).toContain('host');
    expect(actions).toContain('graph');
  });

  describe('buildCommand', () => {
    it('builds list command with inventory', () => {
      const cmd = tool.buildCommand({ action: 'list', inventory: 'hosts' });
      expect(cmd).toContain('ansible-inventory');
      expect(cmd).toContain('--list');
      expect(cmd).toContain('-i');
      expect(cmd).toContain('hosts');
    });

    it('builds host command', () => {
      const cmd = tool.buildCommand({ action: 'host', inventory: 'hosts', host: 'web1' });
      expect(cmd).toContain('--host');
      expect(cmd).toContain('web1');
    });

    it('builds graph command', () => {
      const cmd = tool.buildCommand({ action: 'graph', inventory: 'hosts' });
      expect(cmd).toContain('--graph');
    });

    it('adds graph group and output file flags', () => {
      const cmd = tool.buildCommand({
        action: 'graph',
        inventory: 'hosts',
        graphGroup: 'webservers',
        outputFile: 'inventory.txt',
      });
      expect(cmd).toContain('--output');
      expect(cmd).toContain('inventory.txt');
      expect(cmd.slice(-1)[0]).toBe('webservers');
    });

    it('adds --export flag', () => {
      const cmd = tool.buildCommand({ action: 'list', inventory: 'hosts', export: true });
      expect(cmd).toContain('--export');
    });

    it('adds --vars flag', () => {
      const cmd = tool.buildCommand({ action: 'list', inventory: 'hosts', vars: true });
      expect(cmd).toContain('--vars');
    });

    it('adds yaml format flag', () => {
      const cmd = tool.buildCommand({ action: 'list', inventory: 'hosts', outputFormat: 'yaml' });
      expect(cmd).toContain('--yaml');
    });

    it('does not add json format flag (default)', () => {
      const cmd = tool.buildCommand({ action: 'list', inventory: 'hosts', outputFormat: 'json' });
      expect(cmd).not.toContain('--json');
    });

    it('ignores unknown outputFormat values', () => {
      const cmd = tool.buildCommand({
        action: 'list',
        inventory: 'hosts',
        outputFormat: '--become',
      });
      expect(cmd).not.toContain('----become');
      expect(cmd).not.toContain('--become');
    });

    it('adds limit, extra-vars, and vault flags', () => {
      const cmd = tool.buildCommand({
        action: 'list',
        inventory: 'hosts',
        limit: 'web',
        extraVars: 'env=dev',
        vaultId: 'dev@prompt',
        vaultPasswordFile: '.vault-pass',
        askVaultPass: true,
        flushCache: true,
        playbookDir: '.',
      });
      expect(cmd).toContain('-l');
      expect(cmd).toContain('-e');
      expect(cmd).toContain('--vault-id');
      expect(cmd).toContain('--vault-password-file');
      expect(cmd).toContain('-J');
      expect(cmd).toContain('--flush-cache');
      expect(cmd).toContain('--playbook-dir');
    });
  });

  describe('validate', () => {
    it('returns error when inventory is missing', () => {
      const errors = tool.validate({ action: 'list' });
      expect(errors.some((e) => e.field === 'inventory')).toBe(true);
    });

    it('returns error when host is missing for host action', () => {
      const errors = tool.validate({ action: 'host', inventory: 'hosts' });
      expect(errors.some((e) => e.field === 'host')).toBe(true);
    });

    it('returns no errors for valid list', () => {
      const errors = tool.validate({ action: 'list', inventory: 'hosts' });
      expect(errors).toHaveLength(0);
    });

    it('returns no errors for valid host', () => {
      const errors = tool.validate({ action: 'host', inventory: 'hosts', host: 'web1' });
      expect(errors).toHaveLength(0);
    });
  });

  describe('getParamSchema', () => {
    it('returns schema with export field for list action', () => {
      const schema = tool.getParamSchema('list');
      const exportField = schema.find((f) => f.key === 'export');
      expect(exportField).toBeTruthy();
    });

    it('returns schema with host field for host action', () => {
      const schema = tool.getParamSchema('host');
      const hostField = schema.find((f) => f.key === 'host');
      expect(hostField).toBeTruthy();
      expect(hostField?.required).toBe(true);
    });

    it('returns schema with vars field for graph action', () => {
      const schema = tool.getParamSchema('graph');
      const varsField = schema.find((f) => f.key === 'vars');
      expect(varsField).toBeTruthy();
    });

    it('returns schema with graphGroup for graph action', () => {
      const schema = tool.getParamSchema('graph');
      expect(schema.find((field) => field.key === 'graphGroup')).toBeTruthy();
    });
  });
});
