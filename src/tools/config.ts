import { BaseTool } from './base.js';
import type { ToolParams, ValidationError, ParamSchema } from './base.js';

const CONFIG_ACTIONS = ['list', 'dump', 'view', 'init'] as const;

export class ConfigTool extends BaseTool {
  readonly name = 'ansible-config';

  getActions(): string[] {
    return [...CONFIG_ACTIONS];
  }

  getParamSchema(action: string): ParamSchema[] {
    const common: ParamSchema[] = [
      {
        key: 'configFile',
        label: 'Config file',
        type: 'file',
        placeholder: 'ansible.cfg',
        description: 'Path to ansible.cfg file to use',
      },
    ];

    if (action === 'list') {
      return [
        ...common,
        {
          key: 'onlyChanged',
          label: 'Only changed',
          type: 'checkbox',
          defaultValue: false,
          description: 'Show only configurations that differ from defaults',
        },
      ];
    }

    if (action === 'dump') {
      return [
        ...common,
        {
          key: 'onlyChanged',
          label: 'Only changed',
          type: 'checkbox',
          defaultValue: false,
          description: 'Show only configurations that differ from defaults',
        },
      ];
    }

    if (action === 'view') {
      return common;
    }

    if (action === 'init') {
      return [
        {
          key: 'outputFile',
          label: 'Output file',
          type: 'text',
          isPath: true,
          pathType: 'file',
          placeholder: 'ansible.cfg',
          description: 'Path to write the sample config file',
        },
        {
          key: 'disabled',
          label: 'Disable comments',
          type: 'checkbox',
          defaultValue: false,
          description: 'Do not include comments in sample config',
        },
      ];
    }

    return common;
  }

  validate(_params: ToolParams): ValidationError[] {
    return [];
  }

  buildCommand(params: ToolParams): string[] {
    const cmd = ['ansible-config'];

    cmd.push(params.action as string);

    if (params['configFile']) {
      cmd.push('-c', params['configFile'] as string);
    }
    if (params['onlyChanged']) {
      cmd.push('--only-changed');
    }
    if (params['outputFile']) {
      cmd.push(params['outputFile'] as string);
    }
    if (params['disabled']) {
      cmd.push('--disabled');
    }

    return cmd;
  }
}
