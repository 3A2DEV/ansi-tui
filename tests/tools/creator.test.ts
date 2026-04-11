import { describe, it, expect } from 'vitest';
import { CreatorTool } from '../../src/tools/creator.js';

describe('CreatorTool', () => {
  const tool = new CreatorTool();

  it('has correct name', () => {
    expect(tool.name).toBe('ansible-creator');
  });

  it('returns all actions', () => {
    expect(tool.getActions()).toEqual([
      'init collection',
      'init playbook',
      'init execution_env',
      'add resource',
      'add plugin',
    ]);
  });

  describe('buildCommand', () => {
    it('builds init collection command with output directory and force', () => {
      const cmd = tool.buildCommand({
        action: 'init collection',
        namespace: 'acme',
        collectionName: 'platform',
        outputDir: './collections',
        force: true,
      });

      expect(cmd).toEqual([
        'ansible-creator',
        'init',
        'collection',
        'acme.platform',
        './collections',
        '--force',
      ]);
    });

    it('builds init playbook command with output directory', () => {
      const cmd = tool.buildCommand({
        action: 'init playbook',
        projectName: 'site',
        outputDir: './playbooks',
      });

      expect(cmd).toEqual(['ansible-creator', 'init', 'playbook', 'site', './playbooks']);
    });

    it('builds init execution_env command', () => {
      const cmd = tool.buildCommand({
        action: 'init execution_env',
        eeName: 'my-ee',
        outputDir: './ee',
        force: true,
      });

      expect(cmd).toEqual(['ansible-creator', 'init', 'execution_env', '--ee-name', 'my-ee', './ee', '--force']);
    });

    it('builds add resource command', () => {
      const cmd = tool.buildCommand({
        action: 'add resource',
        resourceType: 'devcontainer',
        projectRoot: './project',
        force: true,
      });

      expect(cmd).toEqual(['ansible-creator', 'add', 'resource', 'devcontainer', './project', '-o']);
    });

    it('builds add plugin command', () => {
      const cmd = tool.buildCommand({
        action: 'add plugin',
        pluginType: 'module',
        pluginName: 'my_plugin',
        projectRoot: './collection',
      });

      expect(cmd).toEqual(['ansible-creator', 'add', 'plugin', 'module', 'my_plugin', './collection']);
    });
  });

  describe('validate', () => {
    it('returns collection-specific errors when required fields are missing', () => {
      const errors = tool.validate({ action: 'init collection' });

      expect(errors.map((error) => error.field)).toEqual(['namespace', 'collectionName']);
    });

    it('returns playbook-specific error when projectName is missing', () => {
      const errors = tool.validate({ action: 'init playbook' });

      expect(errors).toHaveLength(1);
      expect(errors[0]?.field).toBe('projectName');
    });

    it('returns execution environment specific error when eeName is missing', () => {
      const errors = tool.validate({ action: 'init execution_env' });

      expect(errors).toHaveLength(1);
      expect(errors[0]?.field).toBe('eeName');
    });

    it('returns plugin-specific errors when required fields are missing', () => {
      const errors = tool.validate({ action: 'add plugin' });

      expect(errors.map((error) => error.field)).toEqual(['pluginType', 'pluginName']);
    });
  });

  describe('getParamSchema', () => {
    it('returns namespace and collectionName for collection action', () => {
      const schema = tool.getParamSchema('init collection');

      expect(schema.find((field) => field.key === 'namespace')?.required).toBe(true);
      expect(schema.find((field) => field.key === 'collectionName')?.required).toBe(true);
    });

    it('returns projectName for playbook action', () => {
      const schema = tool.getParamSchema('init playbook');

      expect(schema.find((field) => field.key === 'projectName')?.required).toBe(true);
    });

    it('returns resourceType for add resource action', () => {
      const schema = tool.getParamSchema('add resource');

      expect(schema.find((field) => field.key === 'resourceType')?.type).toBe('select');
    });
  });
});
