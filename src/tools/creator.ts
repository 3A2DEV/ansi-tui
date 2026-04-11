import { BaseTool } from './base.js';
import type { ToolParams, ValidationError, ParamSchema } from './base.js';

const CREATOR_ACTIONS = ['init collection', 'init playbook', 'init execution_env', 'add resource', 'add plugin'] as const;

export class CreatorTool extends BaseTool {
  readonly name = 'ansible-creator';

  getActions(): string[] {
    return [...CREATOR_ACTIONS];
  }

  getParamSchema(action: string): ParamSchema[] {
    if (action === 'init collection') {
      return [
        {
          key: 'namespace',
          label: 'Namespace',
          type: 'text',
          required: true,
          placeholder: 'my_namespace',
          description: 'Collection namespace',
        },
        {
          key: 'collectionName',
          label: 'Collection name',
          type: 'text',
          required: true,
          placeholder: 'my_collection',
          description: 'Collection name',
        },
        {
          key: 'outputDir',
          label: 'Output directory',
          type: 'text',
          isPath: true,
          pathType: 'directory',
          placeholder: '.',
          description: 'Directory to create the collection in',
        },
        {
          key: 'force',
          label: 'Force overwrite',
          type: 'checkbox',
          defaultValue: false,
          description: 'Overwrite existing files',
        },
      ];
    }

    if (action === 'init execution_env') {
      return [
        {
          key: 'eeName',
          label: 'Execution environment name',
          type: 'text',
          required: true,
          placeholder: 'my-ee',
          description: 'Name for the execution environment image',
        },
        {
          key: 'outputDir',
          label: 'Output directory',
          type: 'text',
          isPath: true,
          pathType: 'directory',
          placeholder: '.',
          description: 'Directory to create the execution environment project in',
        },
        {
          key: 'force',
          label: 'Force overwrite',
          type: 'checkbox',
          defaultValue: false,
          description: 'Overwrite existing files',
        },
      ];
    }

    if (action === 'add resource') {
      return [
        {
          key: 'resourceType',
          label: 'Resource type',
          type: 'select',
          options: ['devcontainer', 'devfile'],
          required: true,
          description: 'Resource type to add',
        },
        {
          key: 'projectRoot',
          label: 'Project root',
          type: 'text',
          isPath: true,
          pathType: 'directory',
          placeholder: '.',
          description: 'Existing project directory',
        },
        {
          key: 'force',
          label: 'Overwrite existing files',
          type: 'checkbox',
          defaultValue: false,
          description: 'Overwrite existing generated files',
        },
      ];
    }

    if (action === 'add plugin') {
      return [
        {
          key: 'pluginType',
          label: 'Plugin type',
          type: 'select',
          options: ['action', 'filter', 'lookup', 'module', 'test'],
          required: true,
          description: 'Plugin type to add',
        },
        {
          key: 'pluginName',
          label: 'Plugin name',
          type: 'text',
          required: true,
          placeholder: 'my_plugin',
          description: 'Name of the plugin to create',
        },
        {
          key: 'projectRoot',
          label: 'Project root',
          type: 'text',
          isPath: true,
          pathType: 'directory',
          placeholder: '.',
          description: 'Path to the collection root',
        },
        {
          key: 'force',
          label: 'Overwrite existing files',
          type: 'checkbox',
          defaultValue: false,
          description: 'Overwrite existing generated files',
        },
      ];
    }

    return [
      {
        key: 'projectName',
        label: 'Project name',
        type: 'text',
        required: true,
        placeholder: 'my_ansible_project',
        description: 'Name of the project to create',
      },
      {
        key: 'outputDir',
        label: 'Output directory',
        type: 'text',
        isPath: true,
        pathType: 'directory',
        placeholder: '.',
      },
    ];
  }

  validate(params: ToolParams): ValidationError[] {
    const errors: ValidationError[] = [];
    if (params.action === 'init collection') {
      if (!params['namespace']) errors.push({ field: 'namespace', message: 'Namespace is required' });
      if (!params['collectionName']) errors.push({ field: 'collectionName', message: 'Collection name is required' });
    } else if (params.action === 'init execution_env') {
      if (!params['eeName']) errors.push({ field: 'eeName', message: 'Execution environment name is required' });
    } else if (params.action === 'add resource') {
      if (!params['resourceType']) errors.push({ field: 'resourceType', message: 'Resource type is required' });
    } else if (params.action === 'add plugin') {
      if (!params['pluginType']) errors.push({ field: 'pluginType', message: 'Plugin type is required' });
      if (!params['pluginName']) errors.push({ field: 'pluginName', message: 'Plugin name is required' });
    } else {
      if (!params['projectName']) errors.push({ field: 'projectName', message: 'Project name is required' });
    }
    return errors;
  }

  buildCommand(params: ToolParams): string[] {
    const cmd = ['ansible-creator'];
    const parts = (params.action as string).split(' ');

    cmd.push(parts[0]);
    if (parts[1]) {
      cmd.push(parts[1]);
    }

    if (params.action === 'init collection') {
      const ns = params['namespace'] as string;
      const name = params['collectionName'] as string;
      cmd.push(`${ns}.${name}`);
      if (params['outputDir']) {
        cmd.push(params['outputDir'] as string);
      }
    } else if (params.action === 'init execution_env') {
      if (params['eeName']) {
        cmd.push('--ee-name', params['eeName'] as string);
      }
      if (params['outputDir']) {
        cmd.push(params['outputDir'] as string);
      }
    } else if (params.action === 'add resource') {
      if (params['resourceType']) {
        cmd.push(params['resourceType'] as string);
      }
      if (params['projectRoot']) {
        cmd.push(params['projectRoot'] as string);
      }
    } else if (params.action === 'add plugin') {
      if (params['pluginType']) {
        cmd.push(params['pluginType'] as string);
      }
      if (params['pluginName']) {
        cmd.push(params['pluginName'] as string);
      }
      if (params['projectRoot']) {
        cmd.push(params['projectRoot'] as string);
      }
    } else {
      if (params['projectName']) {
        cmd.push(params['projectName'] as string);
      }
      if (params['outputDir']) {
        cmd.push(params['outputDir'] as string);
      }
    }

    if (params['force']) {
      cmd.push(parts[0] === 'add' ? '-o' : '--force');
    }

    return cmd;
  }
}
