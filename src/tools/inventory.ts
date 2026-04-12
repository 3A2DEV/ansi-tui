import { BaseTool } from './base.js';
import type { ToolParams, ValidationError, ParamSchema } from './base.js';
import { VAULT_ASK_PARAMS } from './params.js';

const INVENTORY_ACTIONS = ['list', 'host', 'graph'] as const;
const VALID_OUTPUT_FORMATS = new Set(['json', 'yaml', 'toml']);

export class InventoryTool extends BaseTool {
  readonly name = 'ansible-inventory';

  getActions(): string[] {
    return [...INVENTORY_ACTIONS];
  }

  getParamSchema(action: string): ParamSchema[] {
    const common: ParamSchema[] = [
      {
        key: 'inventory',
        label: 'Inventory',
        type: 'text',
        isPath: true,
        pathType: 'any',
        required: true,
        placeholder: 'hosts.ini or inventory/',
        description: 'Inventory file, directory, or comma-separated hosts',
      },
      {
        key: 'outputFormat',
        label: 'Output format',
        type: 'select',
        options: ['json', 'yaml', 'toml'],
        defaultValue: 'json',
        description: 'Output format for inventory data',
      },
      {
        key: 'limit',
        label: 'Limit hosts',
        type: 'text',
        placeholder: 'webservers',
        description: 'Limit inventory output to matching hosts',
      },
      {
        key: 'extraVars',
        label: 'Extra variables',
        type: 'text',
        placeholder: 'env=dev',
        description: 'Additional variables for inventory processing',
      },
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
        description: 'Vault identity to use',
      },
      ...VAULT_ASK_PARAMS,
      {
        key: 'flushCache',
        label: 'Flush cache',
        type: 'checkbox',
        defaultValue: false,
        description: 'Clear fact cache before reading inventory',
      },
      {
        key: 'playbookDir',
        label: 'Playbook dir',
        type: 'text',
        isPath: true,
        pathType: 'directory',
        placeholder: '.',
        description: 'Base directory for inventory-relative paths',
      },
      {
        key: 'outputFile',
        label: 'Output file',
        type: 'text',
        isPath: true,
        pathType: 'file',
        placeholder: 'inventory.json',
        description: 'Write output to a file',
      },
    ];

    if (action === 'list') {
      return [
        ...common,
        {
          key: 'export',
          label: 'Export',
          type: 'checkbox',
          defaultValue: false,
          description: 'Show all exportable variables',
        },
        {
          key: 'vars',
          label: 'Show vars',
          type: 'checkbox',
          defaultValue: false,
          description: 'Add vars to host/group display',
        },
      ];
    }

    if (action === 'host') {
      return [
        ...common,
        {
          key: 'host',
          label: 'Host name',
          type: 'text',
          required: true,
          placeholder: 'webserver1',
          description: 'Host to show variables for',
        },
      ];
    }

    if (action === 'graph') {
      return [
        ...common,
        {
          key: 'graphGroup',
          label: 'Graph group',
          type: 'text',
          placeholder: 'webservers',
          description: 'Group name to use with graph output',
        },
        {
          key: 'vars',
          label: 'Show vars',
          type: 'checkbox',
          defaultValue: false,
          description: 'Add vars to graph display',
        },
      ];
    }

    return common;
  }

  validate(params: ToolParams): ValidationError[] {
    const errors: ValidationError[] = [];
    if (!params['inventory']) {
      errors.push({ field: 'inventory', message: 'Inventory is required' });
    }
    if (params.action === 'host' && !params['host']) {
      errors.push({ field: 'host', message: 'Host name is required for host action' });
    }
    return errors;
  }

  buildCommand(params: ToolParams): string[] {
    const cmd = ['ansible-inventory'];

    if (params.action === 'list') {
      cmd.push('--list');
    } else if (params.action === 'host') {
      cmd.push('--host', params['host'] as string);
    } else if (params.action === 'graph') {
      cmd.push('--graph');
    }

    if (params['inventory']) {
      cmd.push('-i', params['inventory'] as string);
    }
    if (params['limit']) {
      cmd.push('-l', params['limit'] as string);
    }
    if (params['outputFormat'] && params['outputFormat'] !== 'json') {
      const outputFormat = params['outputFormat'] as string;
      if (VALID_OUTPUT_FORMATS.has(outputFormat)) {
        cmd.push('--' + outputFormat);
      }
    }
    if (params['extraVars']) {
      cmd.push('-e', params['extraVars'] as string);
    }
    if (params['vaultPasswordFile']) {
      cmd.push('--vault-password-file', params['vaultPasswordFile'] as string);
    }
    if (params['vaultId']) {
      cmd.push('--vault-id', params['vaultId'] as string);
    }
    if (params['askVaultPass']) {
      cmd.push('-J');
    }
    if (params['flushCache']) {
      cmd.push('--flush-cache');
    }
    if (params['playbookDir']) {
      cmd.push('--playbook-dir', params['playbookDir'] as string);
    }
    if (params['outputFile']) {
      cmd.push('--output', params['outputFile'] as string);
    }
    if (params['export']) {
      cmd.push('--export');
    }
    if (params['vars']) {
      cmd.push('--vars');
    }
    if (params.action === 'graph' && params['graphGroup']) {
      cmd.push(params['graphGroup'] as string);
    }

    return cmd;
  }
}
