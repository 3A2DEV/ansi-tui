import { describe, it, expect } from 'vitest';
import { ConfigTool } from '../../src/tools/config.js';

describe('ConfigTool', () => {
  const tool = new ConfigTool();

  it('has correct name', () => {
    expect(tool.name).toBe('ansible-config');
  });

  it('returns all actions', () => {
    expect(tool.getActions()).toEqual(['list', 'dump', 'view', 'init', 'validate']);
  });

  describe('buildCommand', () => {
    it('builds list command without only-changed flag support', () => {
      const cmd = tool.buildCommand({
        action: 'list',
        configFile: 'ansible.cfg',
        onlyChanged: true,
      });

      expect(cmd).toEqual(['ansible-config', 'list', '-c', 'ansible.cfg']);
    });

    it('builds init command with output file and disabled flag', () => {
      const cmd = tool.buildCommand({
        action: 'init',
        outputFile: './ansible.cfg',
        disabled: true,
      });

      expect(cmd).toEqual(['ansible-config', 'init', './ansible.cfg', '--disabled']);
    });

    it('builds validate command with config file', () => {
      const cmd = tool.buildCommand({
        action: 'validate',
        configFile: 'ansible.cfg',
      });

      expect(cmd).toEqual(['ansible-config', 'validate', '-c', 'ansible.cfg']);
    });

    it('builds dump command with type and format', () => {
      const cmd = tool.buildCommand({
        action: 'dump',
        configType: 'inventory',
        format: 'yaml',
      });

      expect(cmd).toEqual(['ansible-config', 'dump', '-t', 'inventory', '-f', 'yaml']);
    });
  });

  describe('validate', () => {
    it('returns no errors for any params', () => {
      expect(tool.validate({ action: 'view' })).toHaveLength(0);
    });
  });

  describe('getParamSchema', () => {
    it('returns init-specific fields for init action', () => {
      const schema = tool.getParamSchema('init');

      expect(schema.find((field) => field.key === 'outputFile')?.isPath).toBe(true);
      expect(schema.find((field) => field.key === 'disabled')).toBeTruthy();
    });

    it('returns common configFile field for view action', () => {
      const schema = tool.getParamSchema('view');

      expect(schema.find((field) => field.key === 'configFile')?.type).toBe('file');
    });

    it('returns common configFile field for validate action', () => {
      const schema = tool.getParamSchema('validate');

      expect(schema.find((field) => field.key === 'configFile')?.type).toBe('file');
    });

    it('returns type and format fields for dump action', () => {
      const schema = tool.getParamSchema('dump');

      expect(schema.find((field) => field.key === 'configType')?.type).toBe('select');
      expect(schema.find((field) => field.key === 'format')?.type).toBe('select');
    });
  });
});
