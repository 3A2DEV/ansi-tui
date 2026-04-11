import { BaseTool } from './base.js';
import type { ToolParams, ValidationError, ParamSchema } from './base.js';

const GALAXY_ACTIONS = [
  'role install',
  'role list',
  'role remove',
  'role init',
  'role search',
  'role info',
  'role import',
  'role delete',
  'role setup',
  'collection install',
  'collection list',
  'collection init',
  'collection build',
  'collection publish',
  'collection download',
  'collection verify',
] as const;

export class GalaxyTool extends BaseTool {
  readonly name = 'ansible-galaxy';

  getActions(): string[] {
    return [...GALAXY_ACTIONS];
  }

  getParamSchema(action: string): ParamSchema[] {
    const isRole = action.startsWith('role');
    const subAction = action.split(' ')[1];

    if (action === 'collection build') {
      return [
        {
          key: 'collectionPath',
          label: 'Collection path',
          type: 'text',
          isPath: true,
          pathType: 'directory',
          placeholder: '.',
          description: 'Collection directory containing galaxy.yml',
        },
        {
          key: 'outputPath',
          label: 'Output path',
          type: 'text',
          isPath: true,
          pathType: 'directory',
          placeholder: '.',
          description: 'Directory to write the built tarball to',
        },
        {
          key: 'force',
          label: 'Force',
          type: 'checkbox',
          defaultValue: false,
          description: 'Overwrite existing build output',
        },
      ];
    }

    if (action === 'collection publish') {
      return [
        {
          key: 'collectionTarball',
          label: 'Collection tarball',
          type: 'file',
          required: true,
          placeholder: 'namespace-name-1.0.0.tar.gz',
          description: 'Built collection tarball to publish',
        },
        {
          key: 'apiKey',
          label: 'API key',
          type: 'password',
          placeholder: 'galaxy token',
          description: 'Galaxy API token',
        },
        {
          key: 'server',
          label: 'Galaxy server',
          type: 'text',
          placeholder: 'https://galaxy.ansible.com',
          description: 'Galaxy API server URL',
        },
        {
          key: 'ignoreCerts',
          label: 'Ignore certs',
          type: 'checkbox',
          defaultValue: false,
          description: 'Ignore SSL certificate validation errors',
        },
      ];
    }

    if (action === 'collection download') {
      return [
        {
          key: 'target',
          label: 'Collection name',
          type: 'text',
          placeholder: 'community.general',
          description: 'Collection to download',
        },
        {
          key: 'requirementsFile',
          label: 'Requirements file',
          type: 'file',
          placeholder: 'requirements.yml',
          description: 'File containing collections to download',
        },
        {
          key: 'outputPath',
          label: 'Download path',
          type: 'text',
          isPath: true,
          pathType: 'directory',
          placeholder: '.',
          description: 'Directory to download collections into',
        },
        {
          key: 'noDeps',
          label: 'No dependencies',
          type: 'checkbox',
          defaultValue: false,
          description: 'Skip downloading dependencies',
        },
      ];
    }

    if (action === 'collection verify') {
      return [
        {
          key: 'target',
          label: 'Collection name',
          type: 'text',
          placeholder: 'community.general',
          description: 'Installed collection to verify',
        },
        {
          key: 'requirementsFile',
          label: 'Requirements file',
          type: 'file',
          placeholder: 'requirements.yml',
          description: 'File containing collections to verify',
        },
        {
          key: 'ignoreCerts',
          label: 'Ignore certs',
          type: 'checkbox',
          defaultValue: false,
          description: 'Ignore SSL certificate validation errors',
        },
        {
          key: 'offline',
          label: 'Offline',
          type: 'checkbox',
          defaultValue: false,
          description: 'Verify locally without contacting the server',
        },
      ];
    }

    if (action === 'role info') {
      return [
        {
          key: 'target',
          label: 'Role name',
          type: 'text',
          required: true,
          placeholder: 'geerlingguy.docker',
          description: 'Role to inspect',
        },
        {
          key: 'rolesPath',
          label: 'Roles path',
          type: 'text',
          isPath: true,
          pathType: 'directory',
          placeholder: '~/.ansible/roles',
          description: 'Path to roles directory',
        },
      ];
    }

    if (action === 'role import') {
      return [
        {
          key: 'githubUser',
          label: 'GitHub user',
          type: 'text',
          required: true,
          placeholder: 'my-org',
          description: 'GitHub username or organization',
        },
        {
          key: 'githubRepo',
          label: 'GitHub repo',
          type: 'text',
          required: true,
          placeholder: 'ansible-role-web',
          description: 'GitHub repository name',
        },
        {
          key: 'branch',
          label: 'Branch',
          type: 'text',
          placeholder: 'main',
          description: 'Branch to import',
        },
        {
          key: 'noWait',
          label: 'No wait',
          type: 'checkbox',
          defaultValue: false,
          description: 'Do not wait for import results',
        },
      ];
    }

    if (action === 'role delete') {
      return [
        {
          key: 'githubUser',
          label: 'GitHub user',
          type: 'text',
          required: true,
          placeholder: 'my-org',
          description: 'GitHub username or organization',
        },
        {
          key: 'githubRepo',
          label: 'GitHub repo',
          type: 'text',
          required: true,
          placeholder: 'ansible-role-web',
          description: 'GitHub repository name',
        },
      ];
    }

    if (action === 'role setup') {
      return [
        {
          key: 'source',
          label: 'Source',
          type: 'text',
          required: true,
          placeholder: 'travis',
          description: 'Integration source',
        },
        {
          key: 'githubUser',
          label: 'GitHub user',
          type: 'text',
          required: true,
          placeholder: 'my-org',
          description: 'GitHub username or organization',
        },
        {
          key: 'githubRepo',
          label: 'GitHub repo',
          type: 'text',
          required: true,
          placeholder: 'ansible-role-web',
          description: 'GitHub repository name',
        },
        {
          key: 'secret',
          label: 'Secret',
          type: 'password',
          required: true,
          placeholder: 'webhook secret',
          description: 'Secret used for the integration',
        },
      ];
    }

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
        },
        {
          key: 'apiKey',
          label: 'API key',
          type: 'password',
          placeholder: 'galaxy token',
          description: 'Galaxy API token',
        },
        {
          key: 'ignoreCerts',
          label: 'Ignore certs',
          type: 'checkbox',
          defaultValue: false,
          description: 'Ignore SSL certificate validation errors',
        },
        {
          key: 'timeout',
          label: 'Timeout',
          type: 'text',
          placeholder: '60',
          description: 'Timeout in seconds for Galaxy operations',
        },
        {
          key: 'noDeps',
          label: 'No dependencies',
          type: 'checkbox',
          defaultValue: false,
          description: 'Skip installing dependencies',
        },
        {
          key: 'pre',
          label: 'Include prereleases',
          type: 'checkbox',
          defaultValue: false,
          description: 'Include pre-release versions when resolving content',
        },
        {
          key: 'offline',
          label: 'Offline',
          type: 'checkbox',
          defaultValue: false,
          description: 'Run without contacting Galaxy when supported',
        },
        {
          key: 'ignoreErrors',
          label: 'Ignore errors',
          type: 'checkbox',
          defaultValue: false,
          description: 'Continue processing on install errors',
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

    if (['install', 'download', 'verify'].includes(subAction)) {
      if (!params['target'] && !params['requirementsFile']) {
        errors.push({
          field: 'target',
          message: 'Target name or requirements file is required',
        });
      }
    } else if (['init', 'search', 'remove', 'info'].includes(subAction)) {
      if (!params['target']) {
        errors.push({ field: 'target', message: 'Name is required' });
      }
    } else if (params.action === 'collection publish' && !params['collectionTarball']) {
      errors.push({ field: 'collectionTarball', message: 'Collection tarball is required' });
    } else if (params.action === 'role import' || params.action === 'role delete') {
      if (!params['githubUser']) {
        errors.push({ field: 'githubUser', message: 'GitHub user is required' });
      }
      if (!params['githubRepo']) {
        errors.push({ field: 'githubRepo', message: 'GitHub repo is required' });
      }
    } else if (params.action === 'role setup') {
      if (!params['source']) {
        errors.push({ field: 'source', message: 'Source is required' });
      }
      if (!params['githubUser']) {
        errors.push({ field: 'githubUser', message: 'GitHub user is required' });
      }
      if (!params['githubRepo']) {
        errors.push({ field: 'githubRepo', message: 'GitHub repo is required' });
      }
      if (!params['secret']) {
        errors.push({ field: 'secret', message: 'Secret is required' });
      }
    }

    return errors;
  }

  buildCommand(params: ToolParams): string[] {
    const parts = (params.action as string).split(' ');
    const cmd = ['ansible-galaxy', parts[0], parts[1]];

    if (params.action === 'collection build') {
      if (params['collectionPath']) {
        cmd.push(params['collectionPath'] as string);
      }
      if (params['force']) {
        cmd.push('--force');
      }
      if (params['outputPath']) {
        cmd.push('--output-path', params['outputPath'] as string);
      }
      return cmd;
    }

    if (params.action === 'collection publish') {
      if (params['collectionTarball']) {
        cmd.push(params['collectionTarball'] as string);
      }
      if (params['apiKey']) {
        cmd.push('--token', params['apiKey'] as string);
      }
      if (params['server']) {
        cmd.push('-s', params['server'] as string);
      }
      if (params['ignoreCerts']) {
        cmd.push('-c');
      }
      return cmd;
    }

    if (params.action === 'collection download') {
      if (params['target']) {
        cmd.push(params['target'] as string);
      }
      if (params['requirementsFile']) {
        cmd.push('-r', params['requirementsFile'] as string);
      }
      if (params['outputPath']) {
        cmd.push('--download-path', params['outputPath'] as string);
      }
      if (params['noDeps']) {
        cmd.push('--no-deps');
      }
      return cmd;
    }

    if (params.action === 'collection verify') {
      if (params['target']) {
        cmd.push(params['target'] as string);
      }
      if (params['requirementsFile']) {
        cmd.push('-r', params['requirementsFile'] as string);
      }
      if (params['ignoreCerts']) {
        cmd.push('-c');
      }
      if (params['offline']) {
        cmd.push('--offline');
      }
      return cmd;
    }

    if (params.action === 'role info') {
      if (params['target']) {
        cmd.push(params['target'] as string);
      }
      if (params['rolesPath']) {
        cmd.push('-p', params['rolesPath'] as string);
      }
      return cmd;
    }

    if (params.action === 'role import') {
      if (params['githubUser']) {
        cmd.push(params['githubUser'] as string);
      }
      if (params['githubRepo']) {
        cmd.push(params['githubRepo'] as string);
      }
      if (params['branch']) {
        cmd.push('--branch', params['branch'] as string);
      }
      if (params['noWait']) {
        cmd.push('--no-wait');
      }
      return cmd;
    }

    if (params.action === 'role delete') {
      if (params['githubUser']) {
        cmd.push(params['githubUser'] as string);
      }
      if (params['githubRepo']) {
        cmd.push(params['githubRepo'] as string);
      }
      return cmd;
    }

    if (params.action === 'role setup') {
      if (params['source']) {
        cmd.push(params['source'] as string);
      }
      if (params['githubUser']) {
        cmd.push(params['githubUser'] as string);
      }
      if (params['githubRepo']) {
        cmd.push(params['githubRepo'] as string);
      }
      if (params['secret']) {
        cmd.push(params['secret'] as string);
      }
      return cmd;
    }

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
      cmd.push('-U');
    }
    if (params['server']) {
      cmd.push('-s', params['server'] as string);
    }
    if (params['apiKey']) {
      cmd.push('--token', params['apiKey'] as string);
    }
    if (params['ignoreCerts']) {
      cmd.push('-c');
    }
    if (params['timeout']) {
      cmd.push('--timeout', params['timeout'] as string);
    }
    if (params['noDeps']) {
      cmd.push('--no-deps');
    }
    if (params['pre']) {
      cmd.push('--pre');
    }
    if (params['offline']) {
      cmd.push('--offline');
    }
    if (params['ignoreErrors']) {
      cmd.push('-i');
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
