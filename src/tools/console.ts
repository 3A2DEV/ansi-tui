import { BaseTool } from './base.js';
import type { ToolParams, ValidationError, ParamSchema } from './base.js';

const CONSOLE_ACTIONS = ['start'] as const;

export class ConsoleTool extends BaseTool {
  readonly name = 'ansible-console';

  getActions(): string[] {
    return [...CONSOLE_ACTIONS];
  }

  getParamSchema(_action: string): ParamSchema[] {
    return [
      {
        key: 'inventory',
        label: 'Inventory',
        type: 'text',
        isPath: true,
        pathType: 'any',
        placeholder: 'hosts.ini or inventory/',
        description: 'Inventory file, directory, or comma-separated hosts',
      },
      {
        key: 'limit',
        label: 'Limit hosts',
        type: 'text',
        placeholder: 'webservers',
        description: 'Limit execution to specific hosts',
      },
      {
        key: 'become',
        label: 'Become (sudo)',
        type: 'checkbox',
        defaultValue: false,
        description: 'Enable privilege escalation',
      },
      {
        key: 'becomeUser',
        label: 'Become user',
        type: 'text',
        placeholder: 'root',
      },
      {
        key: 'modulePath',
        label: 'Module path',
        type: 'text',
        isPath: true,
        pathType: 'directory',
        placeholder: './library',
        description: 'Path to additional modules',
      },
      {
        key: 'vaultPasswordFile',
        label: 'Vault password file',
        type: 'file',
        pathType: 'file',
        placeholder: '.vault-pass',
      },
    ];
  }

  validate(_params: ToolParams): ValidationError[] {
    return [];
  }

  buildCommand(params: ToolParams): string[] {
    const cmd = ['ansible-console'];

    if (params['inventory']) {
      cmd.push('-i', params['inventory'] as string);
    }
    if (params['limit']) {
      cmd.push('--limit', params['limit'] as string);
    }
    if (params['become']) {
      cmd.push('--become');
    }
    if (params['becomeUser']) {
      cmd.push('--become-user', params['becomeUser'] as string);
    }
    if (params['modulePath']) {
      cmd.push('-M', params['modulePath'] as string);
    }
    if (params['vaultPasswordFile']) {
      cmd.push('--vault-password-file', params['vaultPasswordFile'] as string);
    }

    return cmd;
  }
}
