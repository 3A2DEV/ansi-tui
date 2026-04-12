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
    expect(actions).toContain('role info');
    expect(actions).toContain('role import');
    expect(actions).toContain('role delete');
    expect(actions).toContain('role setup');
    expect(actions).toContain('collection install');
    expect(actions).toContain('collection list');
    expect(actions).toContain('collection init');
    expect(actions).toContain('collection build');
    expect(actions).toContain('collection publish');
    expect(actions).toContain('collection download');
    expect(actions).toContain('collection verify');
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

    it('builds collection build command', () => {
      const cmd = tool.buildCommand({ action: 'collection build', collectionPath: './collection', outputPath: './dist', force: true });
      expect(cmd).toEqual(['ansible-galaxy', 'collection', 'build', './collection', '--force', '--output-path', './dist']);
    });

    it('builds collection publish command', () => {
      const cmd = tool.buildCommand({
        action: 'collection publish',
        collectionTarball: 'community-general.tar.gz',
        apiKey: 'secret',
        server: 'https://galaxy.example.com',
        ignoreCerts: true,
      });
      expect(cmd).toEqual([
        'ansible-galaxy',
        'collection',
        'publish',
        'community-general.tar.gz',
        '--token',
        'secret',
        '-s',
        'https://galaxy.example.com',
        '-c',
      ]);
    });

    it('builds collection download command', () => {
      const cmd = tool.buildCommand({ action: 'collection download', target: 'community.general', outputPath: './downloads', noDeps: true });
      expect(cmd).toEqual(['ansible-galaxy', 'collection', 'download', 'community.general', '--download-path', './downloads', '--no-deps']);
    });

    it('builds collection verify command', () => {
      const cmd = tool.buildCommand({ action: 'collection verify', target: 'community.general', ignoreCerts: true, offline: true });
      expect(cmd).toEqual(['ansible-galaxy', 'collection', 'verify', 'community.general', '-c', '--offline']);
    });

    it('builds role info command', () => {
      const cmd = tool.buildCommand({ action: 'role info', target: 'geerlingguy.docker', rolesPath: '/opt/roles' });
      expect(cmd).toEqual(['ansible-galaxy', 'role', 'info', 'geerlingguy.docker', '-p', '/opt/roles']);
    });

    it('builds role import command', () => {
      const cmd = tool.buildCommand({ action: 'role import', githubUser: 'acme', githubRepo: 'ansible-role-web', branch: 'main', noWait: true });
      expect(cmd).toEqual(['ansible-galaxy', 'role', 'import', 'acme', 'ansible-role-web', '--branch', 'main', '--no-wait']);
    });

    it('builds role delete command', () => {
      const cmd = tool.buildCommand({ action: 'role delete', githubUser: 'acme', githubRepo: 'ansible-role-web' });
      expect(cmd).toEqual(['ansible-galaxy', 'role', 'delete', 'acme', 'ansible-role-web']);
    });

    it('builds role setup command', () => {
      const cmd = tool.buildCommand({ action: 'role setup', source: 'travis', githubUser: 'acme', githubRepo: 'ansible-role-web', secret: 'top-secret' });
      expect(cmd).toEqual(['ansible-galaxy', 'role', 'setup', 'travis', 'acme', 'ansible-role-web', 'top-secret']);
    });

    it('adds force flag', () => {
      const cmd = tool.buildCommand({ action: 'role install', target: 'my_role', force: true });
      expect(cmd).toContain('--force');
    });

    it('emits -U for upgrade instead of --force-with-deps', () => {
      const cmd = tool.buildCommand({ action: 'collection install', target: 'community.general', upgrade: true });

      expect(cmd).toEqual(['ansible-galaxy', 'collection', 'install', 'community.general', '-U']);
      expect(cmd).not.toContain('--force-with-deps');
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

    it('adds install-only token, timeout, deps, prerelease, offline, and ignore flags', () => {
      const cmd = tool.buildCommand({
        action: 'collection install',
        target: 'community.general',
        apiKey: 'secret',
        ignoreCerts: true,
        timeout: '60',
        noDeps: true,
        pre: true,
        offline: true,
        ignoreErrors: true,
      });

      expect(cmd).toContain('--token');
      expect(cmd).toContain('-c');
      expect(cmd).toContain('--timeout');
      expect(cmd).toContain('--no-deps');
      expect(cmd).toContain('--pre');
      expect(cmd).toContain('--offline');
      expect(cmd).toContain('-i');
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

    it('returns no errors when collection download uses requirements file', () => {
      const errors = tool.validate({ action: 'collection download', requirementsFile: 'requirements.yml' });
      expect(errors).toHaveLength(0);
    });

    it('returns errors when role import params are missing', () => {
      const errors = tool.validate({ action: 'role import' });
      expect(errors.map((error) => error.field)).toEqual(['githubUser', 'githubRepo']);
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

    it('returns publish-specific fields for collection publish', () => {
      const schema = tool.getParamSchema('collection publish');
      expect(schema.find((field) => field.key === 'collectionTarball')?.required).toBe(true);
      expect(schema.find((field) => field.key === 'apiKey')?.type).toBe('password');
    });

    it('returns install-specific api and timeout fields', () => {
      const schema = tool.getParamSchema('collection install');
      expect(schema.find((field) => field.key === 'apiKey')).toBeTruthy();
      expect(schema.find((field) => field.key === 'timeout')).toBeTruthy();
    });
  });
});
