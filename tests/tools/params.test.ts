import { describe, it, expect } from 'vitest';
import { BECOME_PARAMS, BECOME_METHOD_OPTIONS, SSH_PARAMS, VAULT_ASK_PARAMS } from '../../src/tools/params.js';

describe('tool params helpers', () => {
  it('exports become params with expected keys', () => {
    expect(BECOME_METHOD_OPTIONS).toEqual(['sudo', 'su', 'doas', 'pfexec', 'ksu', 'runas', 'machinectl']);
    expect(BECOME_PARAMS.map((param) => param.key)).toEqual([
      'becomeMethod',
      'remoteUser',
      'timeout',
      'askPass',
      'askBecomePass',
      'becomePasswordFile',
    ]);
  });

  it('exports vault ask params with checkbox schema', () => {
    expect(VAULT_ASK_PARAMS).toHaveLength(1);
    expect(VAULT_ASK_PARAMS[0]).toMatchObject({
      key: 'askVaultPass',
      type: 'checkbox',
      defaultValue: false,
    });
  });

  it('exports ssh params with expected argument keys', () => {
    expect(SSH_PARAMS.map((param) => param.key)).toEqual([
      'sshCommonArgs',
      'sshExtraArgs',
      'sftpExtraArgs',
      'scpExtraArgs',
    ]);
    expect(SSH_PARAMS.every((param) => param.type === 'text')).toBe(true);
  });
});
