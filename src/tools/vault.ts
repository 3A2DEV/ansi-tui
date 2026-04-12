import { BaseTool } from './base.js';
import type { ToolParams, ValidationError, ParamSchema } from './base.js';
import { VAULT_ASK_PARAMS } from './params.js';

const VAULT_ACTIONS = [
  'create',
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
      ...VAULT_ASK_PARAMS,
      {
        key: 'encryptVaultId',
        label: 'Encrypt vault ID',
        type: 'text',
        placeholder: 'dev',
        description: 'Vault ID to use when encrypting',
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
        {
          key: 'prompt',
          label: 'Prompt',
          type: 'checkbox',
          defaultValue: false,
          description: 'Prompt for the string to encrypt',
        },
        {
          key: 'showInput',
          label: 'Show input',
          type: 'checkbox',
          defaultValue: false,
          description: 'Show plaintext input while typing',
        },
        {
          key: 'stdinName',
          label: 'Stdin name',
          type: 'text',
          placeholder: 'my_secret',
          description: 'Variable name when reading plaintext from stdin',
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

    if (action === 'create') {
      return [
        {
          key: 'file',
          label: 'Vault file',
          type: 'file',
          required: true,
          placeholder: 'group_vars/all/vault.yml',
          description: 'Path to the new vault file to create',
        },
        {
          key: 'skipTtyCheck',
          label: 'Skip TTY check',
          type: 'checkbox',
          defaultValue: false,
          description: 'Allow creation when no interactive TTY is attached',
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
    if (params['askVaultPass']) {
      cmd.push('-J');
    }
    if (params['encryptVaultId']) {
      cmd.push('--encrypt-vault-id', params['encryptVaultId'] as string);
    }

    if (params.action === 'create') {
      if (params['skipTtyCheck']) {
        cmd.push('--skip-tty-check');
      }
      if (params['file']) {
        cmd.push(params['file'] as string);
      }
    } else if (params.action === 'encrypt_string') {
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
      if (params['prompt']) {
        cmd.push('--prompt');
      }
      if (params['showInput']) {
        cmd.push('--show-input');
      }
      if (params['stdinName']) {
        cmd.push('--stdin-name', params['stdinName'] as string);
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
