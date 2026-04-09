import { BaseTool } from './base.js';
import type { ToolParams, ValidationError, ParamSchema } from './base.js';

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
    if (params['outputFormat'] && params['outputFormat'] !== 'json') {
      const outputFormat = params['outputFormat'] as string;
      if (VALID_OUTPUT_FORMATS.has(outputFormat)) {
        cmd.push('--' + outputFormat);
      }
    }
    if (params['export']) {
      cmd.push('--export');
    }
    if (params['vars']) {
      cmd.push('--vars');
    }

    return cmd;
  }
}
