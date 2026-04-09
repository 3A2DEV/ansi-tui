import { BaseTool } from './base.js';
import type { ToolParams, ValidationError, ParamSchema } from './base.js';

const VAULT_ACTIONS = [
  'encrypt',
  'decrypt',
  'view',
  'edit',
  'rekey',
  'encrypt_string',
] as const;

export class VaultTool extends BaseTool {
  readonly name = 'ansible-vault';

  getActions(): string[] {
    return [...VAULT_ACTIONS];
  }

  getParamSchema(action: string): ParamSchema[] {
    const common: ParamSchema[] = [
      {
        key: 'vaultPasswordFile',
        label: 'Vault password file',
        type: 'file',
        placeholder: '.vault-pass',
        description: 'Path to vault password file',
      },
      {
        key: 'vaultId',
        label: 'Vault ID',
        type: 'text',
        placeholder: 'dev@prompt',
        description: 'Vault identity label',
      },
    ];

    if (action === 'encrypt_string') {
      return [
        {
          key: 'plaintext',
          label: 'String to encrypt',
          type: 'text',
          required: true,
          placeholder: 'secret_value',
          description: 'The plaintext string to encrypt',
        },
        {
          key: 'varName',
          label: 'Variable name',
          type: 'text',
          placeholder: 'my_secret',
          description: 'Variable name for the encrypted string',
        },
        {
          key: 'encryptStringNames',
          label: 'Name',
          type: 'text',
          placeholder: 'some_var_name',
          description: 'Specify variable name for encrypted string',
        },
        {
          key: 'outputFile',
          label: 'Output file',
          type: 'file',
          placeholder: 'encrypted_vars.yml',
          description: 'Write output to file instead of stdout',
        },
        ...common,
      ];
    }

    if (action === 'rekey') {
      return [
        {
          key: 'file',
          label: 'Vault file',
          type: 'file',
          required: true,
          placeholder: 'group_vars/all/vault.yml',
          description: 'Path to the vault-encrypted file to rekey',
        },
        {
          key: 'newVaultPasswordFile',
          label: 'New vault password file',
          type: 'file',
          required: true,
          placeholder: '.new-vault-pass',
          description: 'Path to the new vault password file',
        },
        ...common,
      ];
    }

    if (action === 'view' || action === 'edit') {
      return [
        {
          key: 'file',
          label: 'Vault file',
          type: 'file',
          required: true,
          placeholder: 'group_vars/all/vault.yml',
          description: `Path to the vault file to ${action}`,
        },
        ...common,
      ];
    }

    if (action === 'encrypt' || action === 'decrypt') {
      return [
        {
          key: 'file',
          label: 'File',
          type: 'file',
          required: true,
          placeholder: action === 'encrypt' ? 'secrets.yml' : 'secrets.yml',
          description: `Path to the file to ${action}`,
        },
        {
          key: 'outputFile',
          label: 'Output file',
          type: 'file',
          placeholder: 'output.yml',
          description: 'Write output to a different file',
        },
        ...common,
      ];
    }

    return common;
  }

  validate(params: ToolParams): ValidationError[] {
    const errors: ValidationError[] = [];

    if (params.action !== 'encrypt_string') {
      if (!params['file']) {
        errors.push({ field: 'file', message: 'File path is required' });
      }
    }

    if (params.action === 'encrypt_string' && !params['plaintext']) {
      errors.push({ field: 'plaintext', message: 'Plaintext string is required' });
    }

    if (params.action === 'rekey' && !params['newVaultPasswordFile']) {
      errors.push({ field: 'newVaultPasswordFile', message: 'New vault password file is required' });
    }

    return errors;
  }

  buildCommand(params: ToolParams): string[] {
    const cmd = ['ansible-vault', params.action as string];

    if (params['vaultPasswordFile']) {
      cmd.push('--vault-password-file', params['vaultPasswordFile'] as string);
    }
    if (params['vaultId']) {
      cmd.push('--vault-id', params['vaultId'] as string);
    }

    if (params.action === 'encrypt_string') {
      if (params['plaintext']) {
        cmd.push(params['plaintext'] as string);
      }
      if (params['encryptStringNames']) {
        cmd.push('--name', params['encryptStringNames'] as string);
      } else if (params['varName']) {
        cmd.push('--name', params['varName'] as string);
      }
      if (params['outputFile']) {
        cmd.push('--output', params['outputFile'] as string);
      }
    } else if (params.action === 'rekey') {
      if (params['file']) {
        cmd.push(params['file'] as string);
      }
      if (params['newVaultPasswordFile']) {
        cmd.push('--new-vault-password-file', params['newVaultPasswordFile'] as string);
      }
    } else {
      if (params['file']) {
        cmd.push(params['file'] as string);
      }
      if (params['outputFile']) {
        cmd.push('--output', params['outputFile'] as string);
      }
    }

    return cmd;
  }
}
