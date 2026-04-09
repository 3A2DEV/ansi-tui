import { BaseTool } from './base.js';
import type { ToolParams, ValidationError, ParamSchema } from './base.js';

const CREATOR_ACTIONS = ['init collection', 'init role', 'init playbook'] as const;

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

    if (action === 'init role') {
      return [
        {
          key: 'roleName',
          label: 'Role name',
          type: 'text',
          required: true,
          placeholder: 'my_role',
          description: 'Name of the role to create',
        },
        {
          key: 'outputDir',
          label: 'Output directory',
          type: 'text',
          isPath: true,
          pathType: 'directory',
          placeholder: '.',
          description: 'Directory to create the role in',
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
    } else if (params.action === 'init role') {
      if (!params['roleName']) errors.push({ field: 'roleName', message: 'Role name is required' });
    } else {
      if (!params['projectName']) errors.push({ field: 'projectName', message: 'Project name is required' });
    }
    return errors;
  }

  buildCommand(params: ToolParams): string[] {
    const cmd = ['ansible-creator'];

    cmd.push('init');

    if (params.action === 'init collection') {
      const ns = params['namespace'] as string;
      const name = params['collectionName'] as string;
      cmd.push(`${ns}.${name}`);
      if (params['outputDir']) {
        cmd.push(params['outputDir'] as string);
      }
    } else if (params.action === 'init role') {
      cmd.push('role');
      if (params['roleName']) {
        cmd.push(params['roleName'] as string);
      }
      if (params['outputDir']) {
        cmd.push(params['outputDir'] as string);
      }
    } else {
      cmd.push('playbook');
      if (params['projectName']) {
        cmd.push(params['projectName'] as string);
      }
    }

    if (params['force']) {
      cmd.push('--force');
    }

    return cmd;
  }
}
