import { BaseTool } from './base.js';
import type { ToolParams, ValidationError, ParamSchema } from './base.js';

const PULL_ACTIONS = ['pull'] as const;

export class PullTool extends BaseTool {
  readonly name = 'ansible-pull';

  getActions(): string[] {
    return [...PULL_ACTIONS];
  }

  getParamSchema(_action: string): ParamSchema[] {
    return [
      {
        key: 'url',
        label: 'Repository URL',
        type: 'text',
        required: true,
        placeholder: 'https://github.com/org/ansible-playbooks.git',
        description: 'Git repository URL to pull from',
      },
      {
        key: 'checkout',
        label: 'Checkout ref',
        type: 'text',
        placeholder: 'main or v1.0',
        description: 'Branch, tag, or commit to checkout',
      },
      {
        key: 'directory',
        label: 'Working directory',
        type: 'text',
        isPath: true,
        pathType: 'directory',
        placeholder: '~/.ansible/pull',
        description: 'Directory to clone into',
      },
      {
        key: 'playbook',
        label: 'Playbook',
        type: 'text',
        isPath: true,
        pathType: 'file',
        placeholder: 'local.yml',
        description: 'Playbook to run after pull',
      },
      {
        key: 'modulePath',
        label: 'Module path',
        type: 'text',
        isPath: true,
        pathType: 'directory',
        placeholder: './library',
      },
      {
        key: 'purge',
        label: 'Purge',
        type: 'checkbox',
        defaultValue: false,
        description: 'Delete the repository after playbook run',
      },
      {
        key: 'verifyCommit',
        label: 'Verify commit',
        type: 'checkbox',
          defaultValue: false,
          description: 'Verify GPG signature of checked out commit',
      },
      {
        key: 'inventory',
        label: 'Inventory',
        type: 'text',
        isPath: true,
        pathType: 'any',
        placeholder: 'localhost,',
        description: 'Inventory to use',
      },
      {
        key: 'verbosity',
        label: 'Verbosity',
        type: 'select',
        options: ['default', '-v', '-vv', '-vvv', '-vvvv'],
        defaultValue: 'default',
      },
    ];
  }

  validate(params: ToolParams): ValidationError[] {
    const errors: ValidationError[] = [];
    if (!params['url']) {
      errors.push({ field: 'url', message: 'Repository URL is required' });
    }
    return errors;
  }

  buildCommand(params: ToolParams): string[] {
    const cmd = ['ansible-pull'];

    if (params['inventory']) {
      cmd.push('-i', params['inventory'] as string);
    }
    if (params['checkout']) {
      cmd.push('-C', params['checkout'] as string);
    }
    if (params['directory']) {
      cmd.push('-d', params['directory'] as string);
    }
    if (params['modulePath']) {
      cmd.push('-M', params['modulePath'] as string);
    }
    if (params['purge']) {
      cmd.push('--purge');
    }
    if (params['verifyCommit']) {
      cmd.push('--verify-commit');
    }
    if (params['verbosity'] && params['verbosity'] !== 'default') {
      cmd.push(params['verbosity'] as string);
    }
    if (params['playbook']) {
      cmd.push(params['playbook'] as string);
    }

    if (params['url']) {
      cmd.push(params['url'] as string);
    }

    return cmd;
  }
}
