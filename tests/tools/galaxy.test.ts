import { describe, it, expect } from 'vitest';
import { GalaxyTool } from '../../src/tools/galaxy.js';

describe('GalaxyTool', () => {
  const tool = new GalaxyTool();

  it('has correct name', () => {
    expect(tool.name).toBe('ansible-galaxy');
  });

  it('returns all actions', () => {
    const actions = tool.getActions();
    expect(actions).toContain('role install');
    expect(actions).toContain('role list');
    expect(actions).toContain('role remove');
    expect(actions).toContain('role init');
    expect(actions).toContain('role search');
    expect(actions).toContain('collection install');
    expect(actions).toContain('collection list');
    expect(actions).toContain('collection remove');
    expect(actions).toContain('collection init');
    expect(actions).toContain('collection search');
  });

  describe('buildCommand', () => {
    it('builds role install command', () => {
      const cmd = tool.buildCommand({ action: 'role install', target: 'geerlingguy.docker' });
      expect(cmd).toEqual(['ansible-galaxy', 'role', 'install', 'geerlingguy.docker']);
    });

    it('builds collection install command', () => {
      const cmd = tool.buildCommand({ action: 'collection install', target: 'community.general' });
      expect(cmd).toEqual(['ansible-galaxy', 'collection', 'install', 'community.general']);
    });

    it('builds role list command', () => {
      const cmd = tool.buildCommand({ action: 'role list' });
      expect(cmd).toEqual(['ansible-galaxy', 'role', 'list']);
    });

    it('builds role init command', () => {
      const cmd = tool.buildCommand({ action: 'role init', target: 'my_role' });
      expect(cmd).toEqual(['ansible-galaxy', 'role', 'init', 'my_role']);
    });

    it('builds collection init command', () => {
      const cmd = tool.buildCommand({ action: 'collection init', target: 'ns.coll' });
      expect(cmd).toEqual(['ansible-galaxy', 'collection', 'init', 'ns.coll']);
    });

    it('adds force flag', () => {
      const cmd = tool.buildCommand({ action: 'role install', target: 'my_role', force: true });
      expect(cmd).toContain('--force');
    });

    it('adds requirements file', () => {
      const cmd = tool.buildCommand({ action: 'role install', requirementsFile: 'requirements.yml' });
      expect(cmd).toContain('-r');
      expect(cmd).toContain('requirements.yml');
    });

    it('adds server flag', () => {
      const cmd = tool.buildCommand({ action: 'role install', target: 'my_role', server: 'https://galaxy.example.com' });
      expect(cmd).toContain('-s');
      expect(cmd).toContain('https://galaxy.example.com');
    });

    it('adds roles path for list', () => {
      const cmd = tool.buildCommand({ action: 'role list', rolesPath: '/opt/roles' });
      expect(cmd).toContain('-p');
      expect(cmd).toContain('/opt/roles');
    });
  });

  describe('validate', () => {
    it('returns error when install target is missing', () => {
      const errors = tool.validate({ action: 'role install' });
      expect(errors.length).toBeGreaterThan(0);
    });

    it('returns no errors when install target is provided', () => {
      const errors = tool.validate({ action: 'role install', target: 'my_role' });
      expect(errors).toHaveLength(0);
    });

    it('returns no errors when requirements file is provided', () => {
      const errors = tool.validate({ action: 'role install', requirementsFile: 'requirements.yml' });
      expect(errors).toHaveLength(0);
    });
  });

  describe('getParamSchema', () => {
    it('returns install-specific fields for install action', () => {
      const schema = tool.getParamSchema('role install');
      const targetField = schema.find((f) => f.key === 'target');
      expect(targetField).toBeTruthy();
      expect(targetField?.required).toBe(true);
    });

    it('returns init-specific fields for init action', () => {
      const schema = tool.getParamSchema('role init');
      const targetField = schema.find((f) => f.key === 'target');
      expect(targetField).toBeTruthy();
    });
  });
});
