import { describe, it, expect } from 'vitest';
import { PlaybookTool } from '../../src/tools/playbook.js';

describe('PlaybookTool', () => {
  const tool = new PlaybookTool();

  it('has correct name', () => {
    expect(tool.name).toBe('ansible-playbook');
  });

  it('returns all actions', () => {
    const actions = tool.getActions();
    expect(actions).toContain('run');
    expect(actions).toContain('check');
    expect(actions).toContain('diff');
    expect(actions).toContain('syntax-check');
    expect(actions).toContain('list-hosts');
    expect(actions).toContain('list-tasks');
    expect(actions).toContain('list-tags');
  });

  describe('buildCommand', () => {
    it('builds basic run command', () => {
      const cmd = tool.buildCommand({ action: 'run', playbook: 'site.yml' });
      expect(cmd).toEqual(['ansible-playbook', 'site.yml']);
    });

    it('adds inventory flag', () => {
      const cmd = tool.buildCommand({ action: 'run', playbook: 'site.yml', inventory: 'hosts' });
      expect(cmd).toContain('-i');
      expect(cmd).toContain('hosts');
    });

    it('adds limit flag', () => {
      const cmd = tool.buildCommand({ action: 'run', playbook: 'site.yml', limit: 'webservers' });
      expect(cmd).toContain('--limit');
      expect(cmd).toContain('webservers');
    });

    it('adds tags', () => {
      const cmd = tool.buildCommand({ action: 'run', playbook: 'site.yml', tags: 'deploy,config' });
      expect(cmd).toContain('--tags');
      expect(cmd).toContain('deploy,config');
    });

    it('adds skip-tags', () => {
      const cmd = tool.buildCommand({ action: 'run', playbook: 'site.yml', skipTags: 'slow' });
      expect(cmd).toContain('--skip-tags');
      expect(cmd).toContain('slow');
    });

    it('adds extra-vars', () => {
      const cmd = tool.buildCommand({ action: 'run', playbook: 'site.yml', extraVars: 'key=val' });
      expect(cmd).toContain('--extra-vars');
      expect(cmd).toContain('key=val');
    });

    it('adds verbosity', () => {
      const cmd = tool.buildCommand({ action: 'run', playbook: 'site.yml', verbosity: '-vvv' });
      expect(cmd).toContain('-vvv');
    });

    it('ignores default verbosity', () => {
      const cmd = tool.buildCommand({ action: 'run', playbook: 'site.yml', verbosity: 'default' });
      expect(cmd).not.toContain('default');
    });

    it('adds forks', () => {
      const cmd = tool.buildCommand({ action: 'run', playbook: 'site.yml', forks: '10' });
      expect(cmd).toContain('--forks');
      expect(cmd).toContain('10');
    });

    it('adds become flag', () => {
      const cmd = tool.buildCommand({ action: 'run', playbook: 'site.yml', become: true });
      expect(cmd).toContain('--become');
    });

    it('adds become-user', () => {
      const cmd = tool.buildCommand({ action: 'run', playbook: 'site.yml', becomeUser: 'root' });
      expect(cmd).toContain('--become-user');
      expect(cmd).toContain('root');
    });

    it('adds private-key', () => {
      const cmd = tool.buildCommand({ action: 'run', playbook: 'site.yml', privateKey: '~/.ssh/id_rsa' });
      expect(cmd).toContain('--private-key');
      expect(cmd).toContain('~/.ssh/id_rsa');
    });

    it('adds vault-password-file', () => {
      const cmd = tool.buildCommand({ action: 'run', playbook: 'site.yml', vaultPasswordFile: '.vault-pass' });
      expect(cmd).toContain('--vault-password-file');
      expect(cmd).toContain('.vault-pass');
    });

    it('adds vault-id', () => {
      const cmd = tool.buildCommand({ action: 'run', playbook: 'site.yml', vaultId: 'dev@prompt' });
      expect(cmd).toContain('--vault-id');
      expect(cmd).toContain('dev@prompt');
    });

    it('adds --check for check action', () => {
      const cmd = tool.buildCommand({ action: 'check', playbook: 'site.yml' });
      expect(cmd).toContain('--check');
    });

    it('adds --diff for diff action', () => {
      const cmd = tool.buildCommand({ action: 'diff', playbook: 'site.yml' });
      expect(cmd).toContain('--diff');
    });

    it('adds --syntax-check for syntax-check action', () => {
      const cmd = tool.buildCommand({ action: 'syntax-check', playbook: 'site.yml' });
      expect(cmd).toContain('--syntax-check');
    });

    it('adds playbook list actions', () => {
      expect(tool.buildCommand({ action: 'list-hosts', playbook: 'site.yml' })).toContain('--list-hosts');
      expect(tool.buildCommand({ action: 'list-tasks', playbook: 'site.yml' })).toContain('--list-tasks');
      expect(tool.buildCommand({ action: 'list-tags', playbook: 'site.yml' })).toContain('--list-tags');
    });

    it('adds connection type', () => {
      const cmd = tool.buildCommand({ action: 'run', playbook: 'site.yml', connection: 'local' });
      expect(cmd).toContain('-c');
      expect(cmd).toContain('local');
    });

    it('adds high-priority connection and privilege flags', () => {
      const cmd = tool.buildCommand({
        action: 'run',
        playbook: 'site.yml',
        remoteUser: 'ansible',
        timeout: '15',
        askPass: true,
        askBecomePass: true,
        askVaultPass: true,
        becomeMethod: 'sudo',
        becomePasswordFile: '.become-pass',
        forceHandlers: true,
        flushCache: true,
        startAtTask: 'Deploy app',
        step: true,
        modulePath: './library',
      });

      expect(cmd).toContain('-M');
      expect(cmd).toContain('--become-method');
      expect(cmd).toContain('-u');
      expect(cmd).toContain('-T');
      expect(cmd).toContain('-k');
      expect(cmd).toContain('-K');
      expect(cmd).toContain('--become-password-file');
      expect(cmd).toContain('-J');
      expect(cmd).toContain('--force-handlers');
      expect(cmd).toContain('--flush-cache');
      expect(cmd).toContain('--start-at-task');
      expect(cmd).toContain('--step');
    });

    it('returns just binary when no playbook given', () => {
      const cmd = tool.buildCommand({ action: 'run' });
      expect(cmd).toEqual(['ansible-playbook']);
    });
  });

  describe('validate', () => {
    it('returns error when playbook is missing', () => {
      const errors = tool.validate({ action: 'run' });
      expect(errors).toHaveLength(1);
      expect(errors[0].field).toBe('playbook');
    });

    it('returns no errors when playbook is provided', () => {
      const errors = tool.validate({ action: 'run', playbook: 'site.yml' });
      expect(errors).toHaveLength(0);
    });
  });

  describe('getParamSchema', () => {
    it('returns schema for run action', () => {
      const schema = tool.getParamSchema('run');
      expect(schema.length).toBeGreaterThan(0);
      const playbookField = schema.find((f) => f.key === 'playbook');
      expect(playbookField).toBeTruthy();
      expect(playbookField?.required).toBe(true);
    });

    it('returns schema with check mode for check action', () => {
      const schema = tool.getParamSchema('check');
      const checkField = schema.find((f) => f.key === 'checkMode');
      expect(checkField).toBeTruthy();
    });

    it('returns schema with diff mode for diff action', () => {
      const schema = tool.getParamSchema('diff');
      const diffField = schema.find((f) => f.key === 'diffMode');
      expect(diffField).toBeTruthy();
    });

    it('returns added high-priority fields for run action', () => {
      const schema = tool.getParamSchema('run');
      expect(schema.find((field) => field.key === 'askVaultPass')).toBeTruthy();
      expect(schema.find((field) => field.key === 'becomeMethod')).toBeTruthy();
      expect(schema.find((field) => field.key === 'modulePath')).toBeTruthy();
    });
  });
});
