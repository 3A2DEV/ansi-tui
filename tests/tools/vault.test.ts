import { describe, it, expect } from 'vitest';
import { VaultTool } from '../../src/tools/vault.js';

describe('VaultTool', () => {
  const tool = new VaultTool();

  it('has correct name', () => {
    expect(tool.name).toBe('ansible-vault');
  });

  it('returns all actions', () => {
    const actions = tool.getActions();
    expect(actions).toContain('encrypt');
    expect(actions).toContain('decrypt');
    expect(actions).toContain('view');
    expect(actions).toContain('edit');
    expect(actions).toContain('rekey');
    expect(actions).toContain('encrypt_string');
  });

  describe('buildCommand', () => {
    it('builds encrypt command', () => {
      const cmd = tool.buildCommand({ action: 'encrypt', file: 'secrets.yml' });
      expect(cmd).toEqual(['ansible-vault', 'encrypt', 'secrets.yml']);
    });

    it('builds decrypt command', () => {
      const cmd = tool.buildCommand({ action: 'decrypt', file: 'secrets.yml' });
      expect(cmd).toEqual(['ansible-vault', 'decrypt', 'secrets.yml']);
    });

    it('builds view command', () => {
      const cmd = tool.buildCommand({ action: 'view', file: 'secrets.yml' });
      expect(cmd).toEqual(['ansible-vault', 'view', 'secrets.yml']);
    });

    it('builds edit command', () => {
      const cmd = tool.buildCommand({ action: 'edit', file: 'secrets.yml' });
      expect(cmd).toEqual(['ansible-vault', 'edit', 'secrets.yml']);
    });

    it('builds rekey command', () => {
      const cmd = tool.buildCommand({
        action: 'rekey',
        file: 'secrets.yml',
        newVaultPasswordFile: '.new-pass',
      });
      expect(cmd).toContain('ansible-vault');
      expect(cmd).toContain('rekey');
      expect(cmd).toContain('secrets.yml');
      expect(cmd).toContain('--new-vault-password-file');
      expect(cmd).toContain('.new-pass');
    });

    it('builds encrypt_string command', () => {
      const cmd = tool.buildCommand({
        action: 'encrypt_string',
        plaintext: 'my_secret',
      });
      expect(cmd).toContain('ansible-vault');
      expect(cmd).toContain('encrypt_string');
      expect(cmd).toContain('my_secret');
    });

    it('adds --name for encrypt_string with varName', () => {
      const cmd = tool.buildCommand({
        action: 'encrypt_string',
        plaintext: 'secret',
        varName: 'db_password',
      });
      expect(cmd).toContain('--name');
      expect(cmd).toContain('db_password');
    });

    it('adds vault-password-file', () => {
      const cmd = tool.buildCommand({
        action: 'encrypt',
        file: 'secrets.yml',
        vaultPasswordFile: '.vault-pass',
      });
      expect(cmd).toContain('--vault-password-file');
      expect(cmd).toContain('.vault-pass');
    });

    it('adds vault-id', () => {
      const cmd = tool.buildCommand({
        action: 'encrypt',
        file: 'secrets.yml',
        vaultId: 'dev@prompt',
      });
      expect(cmd).toContain('--vault-id');
      expect(cmd).toContain('dev@prompt');
    });

    it('adds output file', () => {
      const cmd = tool.buildCommand({
        action: 'encrypt',
        file: 'secrets.yml',
        outputFile: 'encrypted.yml',
      });
      expect(cmd).toContain('--output');
      expect(cmd).toContain('encrypted.yml');
    });
  });

  describe('validate', () => {
    it('returns error when file is missing for encrypt', () => {
      const errors = tool.validate({ action: 'encrypt' });
      expect(errors).toHaveLength(1);
      expect(errors[0].field).toBe('file');
    });

    it('returns error when plaintext is missing for encrypt_string', () => {
      const errors = tool.validate({ action: 'encrypt_string' });
      expect(errors.some((e) => e.field === 'plaintext')).toBe(true);
    });

    it('returns error when newVaultPasswordFile is missing for rekey', () => {
      const errors = tool.validate({ action: 'rekey', file: 'secrets.yml' });
      expect(errors.some((e) => e.field === 'newVaultPasswordFile')).toBe(true);
    });

    it('returns no errors for valid encrypt', () => {
      const errors = tool.validate({ action: 'encrypt', file: 'secrets.yml' });
      expect(errors).toHaveLength(0);
    });

    it('returns no errors for valid view', () => {
      const errors = tool.validate({ action: 'view', file: 'secrets.yml' });
      expect(errors).toHaveLength(0);
    });
  });

  describe('getParamSchema', () => {
    it('returns file field for encrypt action', () => {
      const schema = tool.getParamSchema('encrypt');
      const fileField = schema.find((f) => f.key === 'file');
      expect(fileField).toBeTruthy();
      expect(fileField?.required).toBe(true);
    });

    it('returns plaintext field for encrypt_string action', () => {
      const schema = tool.getParamSchema('encrypt_string');
      const plainField = schema.find((f) => f.key === 'plaintext');
      expect(plainField).toBeTruthy();
      expect(plainField?.required).toBe(true);
    });

    it('returns newVaultPasswordFile for rekey action', () => {
      const schema = tool.getParamSchema('rekey');
      const newPassField = schema.find((f) => f.key === 'newVaultPasswordFile');
      expect(newPassField).toBeTruthy();
      expect(newPassField?.required).toBe(true);
    });
  });
});
