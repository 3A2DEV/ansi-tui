import { describe, it, expect } from 'vitest';
import { PullTool } from '../../src/tools/pull.js';

describe('PullTool', () => {
  const tool = new PullTool();

  describe('buildCommand', () => {
    it('emits -U before the url value', () => {
      const url = 'https://github.com/org/repo.git';
      const cmd = tool.buildCommand({ action: 'pull', url });

      expect(cmd).toEqual(['ansible-pull', '-U', url]);
      expect(cmd).not.toContain(`"${url}"`);
    });

    it('omits url arg when not provided', () => {
      const cmd = tool.buildCommand({ action: 'pull' });
      expect(cmd.some((arg) => arg.startsWith('http'))).toBe(false);
    });

    it('does not push url as bare positional', () => {
      const url = 'https://github.com/org/repo.git';
      const cmd = tool.buildCommand({ action: 'pull', url, playbook: 'site.yml' });

      expect(cmd.slice(-1)[0]).toBe('site.yml');
      expect(cmd).toEqual(['ansible-pull', '-U', url, 'site.yml']);
    });

    it('adds high-priority pull options', () => {
      const cmd = tool.buildCommand({
        action: 'pull',
        url: 'https://github.com/org/repo.git',
        playbook: 'site.yml',
        extraVars: 'env=dev',
        tags: 'deploy',
        skipTags: 'slow',
        limit: 'web',
        full: true,
        clean: true,
        trackSubs: true,
        acceptHostKey: true,
        moduleName: 'git',
        force: true,
        onlyIfChanged: true,
        sleep: '15',
        flushCache: true,
        listHosts: true,
        vaultId: 'dev@prompt',
        vaultPasswordFile: '.vault-pass',
        askVaultPass: true,
        askBecomePass: true,
        remoteUser: 'ansible',
        connection: 'ssh',
        timeout: '10',
        privateKey: '~/.ssh/id_rsa',
      });

      expect(cmd).toContain('-e');
      expect(cmd).toContain('-t');
      expect(cmd).toContain('--skip-tags');
      expect(cmd).toContain('--full');
      expect(cmd).toContain('--clean');
      expect(cmd).toContain('--track-subs');
      expect(cmd).toContain('--accept-host-key');
      expect(cmd).toContain('-m');
      expect(cmd).toContain('-f');
      expect(cmd).toContain('-o');
      expect(cmd).toContain('-s');
      expect(cmd).toContain('--flush-cache');
      expect(cmd).toContain('--list-hosts');
      expect(cmd).toContain('--vault-id');
      expect(cmd).toContain('--vault-password-file');
      expect(cmd).toContain('-J');
      expect(cmd).toContain('-K');
      expect(cmd).toContain('-u');
      expect(cmd).toContain('-c');
      expect(cmd).toContain('-T');
      expect(cmd).toContain('--private-key');
    });
  });
});
