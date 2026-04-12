import { BaseTool } from './base.js';
import type { ToolParams, ValidationError, ParamSchema } from './base.js';

const DOC_ACTIONS = ['lookup', 'list', 'list_files', 'metadata-dump'] as const;
const DOC_PLUGIN_TYPES = ['module', 'become', 'cache', 'callback', 'cliconf', 'connection', 'httpapi', 'inventory', 'lookup', 'netconf', 'shell', 'strategy', 'test', 'vars', 'filter', 'role', 'keyword'] as const;

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
          key: 'pluginType',
          label: 'Plugin type',
          type: 'select',
          options: [...DOC_PLUGIN_TYPES],
          defaultValue: 'module',
          description: 'Plugin type to inspect',
        },
        {
          key: 'outputFormat',
          label: 'Output format',
          type: 'select',
          options: ['text', 'json'],
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
        {
          key: 'rolesPath',
          label: 'Roles path',
          type: 'text',
          isPath: true,
          pathType: 'directory',
          placeholder: '~/.ansible/roles',
          description: 'Additional roles path',
        },
        {
          key: 'entryPoint',
          label: 'Entry point',
          type: 'text',
          placeholder: 'main',
          description: 'Entry point for role documentation',
        },
        {
          key: 'modulePath',
          label: 'Module path',
          type: 'text',
          isPath: true,
          pathType: 'directory',
          placeholder: './plugins/modules',
          description: 'Additional module search path',
        },
        {
          key: 'playbookDir',
          label: 'Playbook dir',
          type: 'text',
          isPath: true,
          pathType: 'directory',
          placeholder: '.',
          description: 'Base directory for playbook-relative resolution',
        },
      ];
    }

    if (action === 'list' || action === 'list_files') {
      return [
        {
          key: 'collection',
          label: 'Collection filter',
          type: 'text',
          placeholder: 'community.general',
          description: 'Filter by collection name (leave empty for all)',
        },
        {
          key: 'pluginType',
          label: 'Plugin type',
          type: 'select',
          options: [...DOC_PLUGIN_TYPES],
          defaultValue: 'module',
          description: action === 'list_files' ? 'Plugin type to list files for' : 'Plugin type to list',
        },
        {
          key: 'outputFormat',
          label: 'Output format',
          type: 'select',
          options: ['short', 'json'],
          defaultValue: 'short',
          description: 'Output format for listing',
        },
        {
          key: 'rolesPath',
          label: 'Roles path',
          type: 'text',
          isPath: true,
          pathType: 'directory',
          placeholder: '~/.ansible/roles',
          description: 'Additional roles path',
        },
        {
          key: 'modulePath',
          label: 'Module path',
          type: 'text',
          isPath: true,
          pathType: 'directory',
          placeholder: './plugins/modules',
          description: 'Additional module search path',
        },
        {
          key: 'playbookDir',
          label: 'Playbook dir',
          type: 'text',
          isPath: true,
          pathType: 'directory',
          placeholder: '.',
          description: 'Base directory for playbook-relative resolution',
        },
      ];
    }

    if (action === 'metadata-dump') {
      return [];
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

    if (params['pluginType'] && params['pluginType'] !== 'module') {
      cmd.push('-t', params['pluginType'] as string);
    }
    if (params['modulePath']) {
      cmd.push('-M', params['modulePath'] as string);
    }
    if (params['playbookDir']) {
      cmd.push('--playbook-dir', params['playbookDir'] as string);
    }
    if (params['rolesPath']) {
      cmd.push('-r', params['rolesPath'] as string);
    }
    if (params['entryPoint']) {
      cmd.push('-e', params['entryPoint'] as string);
    }
    if (params['snippet']) {
      cmd.push('-s');
    }

    if (params.action === 'list') {
      cmd.push('-l');
      if (params['collection']) {
        cmd.push(params['collection'] as string);
      }
    } else if (params.action === 'list_files') {
      cmd.push('-F');
      if (params['collection']) {
        cmd.push(params['collection'] as string);
      }
    } else if (params.action === 'metadata-dump') {
      cmd.push('--metadata-dump');
    } else {
      if (params['module']) {
        cmd.push(params['module'] as string);
      }
    }

    if (params['outputFormat'] === 'json') {
      cmd.push('--json');
    }

    return cmd;
  }
}
