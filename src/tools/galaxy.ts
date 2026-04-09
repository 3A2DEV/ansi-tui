import { BaseTool } from './base.js';
import type { ToolParams, ValidationError, ParamSchema } from './base.js';

const GALAXY_ACTIONS = [
  'role install',
  'role list',
  'role remove',
  'role init',
  'role search',
  'collection install',
  'collection list',
  'collection remove',
  'collection init',
  'collection search',
] as const;

export class GalaxyTool extends BaseTool {
  readonly name = 'ansible-galaxy';

  getActions(): string[] {
    return [...GALAXY_ACTIONS];
  }

  getParamSchema(action: string): ParamSchema[] {
    const isRole = action.startsWith('role');
    const subAction = action.split(' ')[1];

    const common: ParamSchema[] = [];

    if (subAction === 'install') {
      common.push(
        {
          key: 'target',
          label: isRole ? 'Role name' : 'Collection name',
          type: 'text',
          required: true,
          placeholder: isRole ? 'geerlingguy.docker' : 'community.general',
          description: isRole ? 'Role to install (name or file)' : 'Collection to install (name or file)',
        },
        {
          key: 'requirementsFile',
          label: 'Requirements file',
          type: 'file',
          placeholder: 'requirements.yml',
          description: 'File containing list of roles/collections to install',
        },
        {
          key: 'force',
          label: 'Force',
          type: 'checkbox',
          defaultValue: false,
          description: 'Force overwriting existing installation',
        },
        {
          key: 'upgrade',
          label: 'Upgrade',
          type: 'checkbox',
          defaultValue: false,
          description: 'Upgrade installed roles/collections',
        },
        {
          key: 'server',
          label: 'Galaxy server',
          type: 'text',
          placeholder: 'https://galaxy.ansible.com',
          description: 'Galaxy API server URL',
        }
      );
    } else if (subAction === 'list') {
      if (isRole) {
        common.push(
          {
            key: 'rolesPath',
            label: 'Roles path',
            type: 'text',
            isPath: true,
            pathType: 'directory',
            placeholder: '~/.ansible/roles',
            description: 'Path to roles directory',
          }
        );
      } else {
        common.push(
          {
            key: 'collectionsPath',
            label: 'Collections path',
            type: 'text',
            isPath: true,
            pathType: 'directory',
            placeholder: '~/.ansible/collections',
            description: 'Path to collections directory',
          }
        );
      }
    } else if (subAction === 'init') {
      common.push(
        {
          key: 'target',
          label: isRole ? 'Role name' : 'Collection name',
          type: 'text',
          required: true,
          placeholder: isRole ? 'my_new_role' : 'namespace.collection_name',
          description: isRole ? 'Name of the new role' : 'Namespace.collection name',
        },
          {
            key: 'initPath',
            label: 'Output directory',
            type: 'text',
            isPath: true,
            pathType: 'directory',
            placeholder: '.',
            description: 'Directory to create the role/collection in',
          }
      );
    } else if (subAction === 'search') {
      common.push(
        {
          key: 'target',
          label: 'Search term',
          type: 'text',
          required: true,
          placeholder: 'docker',
          description: 'Search keyword',
        },
        {
          key: 'galaxyType',
          label: 'Type',
          type: 'select',
          options: ['role', 'collection'],
          defaultValue: isRole ? 'role' : 'collection',
        }
      );
    } else if (subAction === 'remove') {
      common.push(
        {
          key: 'target',
          label: isRole ? 'Role name' : 'Collection name',
          type: 'text',
          required: true,
          description: isRole ? 'Role to remove' : 'Collection to remove',
        }
      );
    }

    if (subAction !== 'list' && subAction !== 'remove' && subAction !== 'install') {
      common.push(
        {
          key: 'force',
          label: 'Force',
          type: 'checkbox',
          defaultValue: false,
        }
      );
    }

    return common;
  }

  validate(params: ToolParams): ValidationError[] {
    const errors: ValidationError[] = [];
    const subAction = params.action.split(' ')[1] as string;

    if (['install', 'init', 'search', 'remove'].includes(subAction)) {
      if (!params['target'] && !params['requirementsFile']) {
        errors.push({
          field: 'target',
          message: `${subAction === 'install' ? 'Target name' : 'Name'} or requirements file is required`,
        });
      }
    }

    return errors;
  }

  buildCommand(params: ToolParams): string[] {
    const parts = (params.action as string).split(' ');
    const cmd = ['ansible-galaxy', parts[0], parts[1]];

    if (params['target']) {
      cmd.push(params['target'] as string);
    }

    if (params['requirementsFile']) {
      cmd.push('-r', params['requirementsFile'] as string);
    }
    if (params['force']) {
      cmd.push('--force');
    }
    if (params['upgrade']) {
      cmd.push('--force-with-deps');
    }
    if (params['server']) {
      cmd.push('-s', params['server'] as string);
    }
    if (params['rolesPath']) {
      cmd.push('-p', params['rolesPath'] as string);
    }
    if (params['collectionsPath']) {
      cmd.push('-p', params['collectionsPath'] as string);
    }
    if (params['initPath']) {
      cmd.push('--init-path', params['initPath'] as string);
    }
    if (params['galaxyType']) {
      cmd.push('--type', params['galaxyType'] as string);
    }

    return cmd;
  }
}
