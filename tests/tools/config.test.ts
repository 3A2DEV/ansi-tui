import { describe, it, expect } from 'vitest';
import { ConfigTool } from '../../src/tools/config.js';

describe('ConfigTool', () => {
  const tool = new ConfigTool();

  it('has correct name', () => {
    expect(tool.name).toBe('ansible-config');
  });

  it('returns all actions', () => {
    expect(tool.getActions()).toEqual(['list', 'dump', 'view', 'init']);
  });

  describe('buildCommand', () => {
    it('builds list command with config file and only-changed flag', () => {
      const cmd = tool.buildCommand({
        action: 'list',
        configFile: 'ansible.cfg',
        onlyChanged: true,
      });

      expect(cmd).toEqual(['ansible-config', 'list', '-c', 'ansible.cfg', '--only-changed']);
    });

    it('builds init command with output file and disabled flag', () => {
      const cmd = tool.buildCommand({
        action: 'init',
        outputFile: './ansible.cfg',
        disabled: true,
      });

      expect(cmd).toEqual(['ansible-config', 'init', './ansible.cfg', '--disabled']);
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
  });
});
