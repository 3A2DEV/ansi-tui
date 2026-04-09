import { describe, it, expect } from 'vitest';
import { DocTool } from '../../src/tools/doc.js';

describe('DocTool', () => {
  const tool = new DocTool();

  it('has correct name', () => {
    expect(tool.name).toBe('ansible-doc');
  });

  it('returns all actions', () => {
    expect(tool.getActions()).toEqual(['lookup', 'list']);
  });

  describe('buildCommand', () => {
    it('builds lookup command with snippet and json output', () => {
      const cmd = tool.buildCommand({
        action: 'lookup',
        module: 'copy',
        snippet: true,
        outputFormat: 'json',
      });

      expect(cmd).toEqual(['ansible-doc', '-t', 'json', '-s', 'copy', '--json']);
    });

    it('builds list command with collection filter and yaml output', () => {
      const cmd = tool.buildCommand({
        action: 'list',
        collection: 'community.general',
        outputFormat: 'yaml',
      });

      expect(cmd).toEqual(['ansible-doc', '-t', 'yaml', '-l', 'community.general', '--yaml']);
    });
  });

  describe('validate', () => {
    it('returns error when lookup module is missing', () => {
      const errors = tool.validate({ action: 'lookup' });

      expect(errors).toHaveLength(1);
      expect(errors[0]?.field).toBe('module');
    });

    it('returns no errors for list action without collection', () => {
      expect(tool.validate({ action: 'list' })).toHaveLength(0);
    });
  });

  describe('getParamSchema', () => {
    it('returns module field for lookup action', () => {
      const schema = tool.getParamSchema('lookup');

      expect(schema.find((field) => field.key === 'module')?.required).toBe(true);
    });

    it('returns collection field for list action', () => {
      const schema = tool.getParamSchema('list');

      expect(schema.find((field) => field.key === 'collection')).toBeTruthy();
      expect(schema.find((field) => field.key === 'module')).toBeUndefined();
    });
  });
});
