import { describe, it, expect } from 'vitest';
import { DocTool } from '../../src/tools/doc.js';

describe('DocTool', () => {
  const tool = new DocTool();

  it('has correct name', () => {
    expect(tool.name).toBe('ansible-doc');
  });

  it('returns all actions', () => {
    expect(tool.getActions()).toEqual(['lookup', 'list', 'list_files', 'metadata-dump']);
  });

  describe('buildCommand', () => {
    it('does not emit -t for outputFormat json', () => {
      const cmd = tool.buildCommand({
        action: 'lookup',
        module: 'copy',
        snippet: true,
        outputFormat: 'json',
      });

      expect(cmd).toEqual(['ansible-doc', '-s', 'copy', '--json']);
    });

    it('adds rolesPath, modulePath, playbookDir, and entryPoint for lookup', () => {
      const cmd = tool.buildCommand({
        action: 'lookup',
        module: 'copy',
        rolesPath: './roles',
        modulePath: './plugins/modules',
        playbookDir: '.',
        entryPoint: 'main',
      });

      expect(cmd).toEqual(['ansible-doc', '-M', './plugins/modules', '--playbook-dir', '.', '-r', './roles', '-e', 'main', 'copy']);
    });

    it('emits -t for plugin type when not module', () => {
      const cmd = tool.buildCommand({
        action: 'lookup',
        module: 'net_get',
        pluginType: 'lookup',
      });

      expect(cmd).toEqual(['ansible-doc', '-t', 'lookup', 'net_get']);
    });

    it('does not emit -t when pluginType is module', () => {
      const cmd = tool.buildCommand({
        action: 'list',
        pluginType: 'module',
      });

      expect(cmd).toEqual(['ansible-doc', '-l']);
    });

    it('builds list_files and metadata-dump actions', () => {
      expect(tool.buildCommand({ action: 'list_files', collection: 'community.general' })).toEqual([
        'ansible-doc',
        '-F',
        'community.general',
      ]);
      expect(tool.buildCommand({ action: 'metadata-dump' })).toEqual(['ansible-doc', '--metadata-dump']);
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
      expect(schema.find((field) => field.key === 'pluginType')?.defaultValue).toBe('module');
    });

    it('returns collection field for list action', () => {
      const schema = tool.getParamSchema('list');

      expect(schema.find((field) => field.key === 'collection')).toBeTruthy();
      expect(schema.find((field) => field.key === 'module')).toBeUndefined();
    });

    it('returns empty schema for metadata-dump', () => {
      expect(tool.getParamSchema('metadata-dump')).toEqual([]);
    });
  });
});
