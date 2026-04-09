import { BaseTool } from './base.js';
import type { ToolParams, ValidationError, ParamSchema } from './base.js';

const DOC_ACTIONS = ['lookup', 'list'] as const;

export class DocTool extends BaseTool {
  readonly name = 'ansible-doc';

  getActions(): string[] {
    return [...DOC_ACTIONS];
  }

  getParamSchema(action: string): ParamSchema[] {
    if (action === 'lookup') {
      return [
        {
          key: 'module',
          label: 'Module name',
          type: 'text',
          required: true,
          placeholder: 'ansible.builtin.copy or copy',
          description: 'Module name or FQCN to look up',
        },
        {
          key: 'outputFormat',
          label: 'Output format',
          type: 'select',
          options: ['text', 'json', 'yaml'],
          defaultValue: 'text',
          description: 'Output format for documentation',
        },
        {
          key: 'snippet',
          label: 'Show snippet',
          type: 'checkbox',
          defaultValue: false,
          description: 'Show playbook snippet for module',
        },
      ];
    }

    if (action === 'list') {
      return [
        {
          key: 'collection',
          label: 'Collection filter',
          type: 'text',
          placeholder: 'community.general',
          description: 'Filter by collection name (leave empty for all)',
        },
        {
          key: 'outputFormat',
          label: 'Output format',
          type: 'select',
          options: ['short', 'json', 'yaml'],
          defaultValue: 'short',
          description: 'Output format for listing',
        },
      ];
    }

    return [];
  }

  validate(params: ToolParams): ValidationError[] {
    const errors: ValidationError[] = [];
    if (params.action === 'lookup' && !params['module']) {
      errors.push({ field: 'module', message: 'Module name is required' });
    }
    return errors;
  }

  buildCommand(params: ToolParams): string[] {
    const cmd = ['ansible-doc'];

    if (params['outputFormat'] && params['outputFormat'] !== 'text' && params['outputFormat'] !== 'short') {
      cmd.push('-t', params['outputFormat'] as string);
    }
    if (params['snippet']) {
      cmd.push('-s');
    }

    if (params.action === 'list') {
      cmd.push('-l');
      if (params['collection']) {
        cmd.push(params['collection'] as string);
      }
    } else {
      if (params['module']) {
        cmd.push(params['module'] as string);
      }
    }

    if (params['outputFormat'] === 'json') {
      cmd.push('--json');
    } else if (params['outputFormat'] === 'yaml') {
      cmd.push('--yaml');
    }

    return cmd;
  }
}
