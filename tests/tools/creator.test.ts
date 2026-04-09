import { describe, it, expect } from 'vitest';
import { CreatorTool } from '../../src/tools/creator.js';

describe('CreatorTool', () => {
  const tool = new CreatorTool();

  it('has correct name', () => {
    expect(tool.name).toBe('ansible-creator');
  });

  it('returns all actions', () => {
    expect(tool.getActions()).toEqual(['init collection', 'init role', 'init playbook']);
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
        'acme.platform',
        './collections',
        '--force',
      ]);
    });

    it('builds init role command', () => {
      const cmd = tool.buildCommand({
        action: 'init role',
        roleName: 'web',
        outputDir: './roles',
      });

      expect(cmd).toEqual(['ansible-creator', 'init', 'role', 'web', './roles']);
    });

    it('builds init playbook command', () => {
      const cmd = tool.buildCommand({
        action: 'init playbook',
        projectName: 'site',
      });

      expect(cmd).toEqual(['ansible-creator', 'init', 'playbook', 'site']);
    });
  });

  describe('validate', () => {
    it('returns collection-specific errors when required fields are missing', () => {
      const errors = tool.validate({ action: 'init collection' });

      expect(errors.map((error) => error.field)).toEqual(['namespace', 'collectionName']);
    });

    it('returns role-specific error when roleName is missing', () => {
      const errors = tool.validate({ action: 'init role' });

      expect(errors).toHaveLength(1);
      expect(errors[0]?.field).toBe('roleName');
    });

    it('returns playbook-specific error when projectName is missing', () => {
      const errors = tool.validate({ action: 'init playbook' });

      expect(errors).toHaveLength(1);
      expect(errors[0]?.field).toBe('projectName');
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
  });
});
