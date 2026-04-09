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

    it('adds connection type', () => {
      const cmd = tool.buildCommand({ action: 'run', playbook: 'site.yml', connection: 'local' });
      expect(cmd).toContain('-c');
      expect(cmd).toContain('local');
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
  });
});
