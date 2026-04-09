import { BaseTool } from './base.js';
import type { ToolParams, ValidationError, ParamSchema } from './base.js';

const TEST_ACTIONS = ['units', 'integration', 'sanity'] as const;

export class TestTool extends BaseTool {
  readonly name = 'ansible-test';

  getActions(): string[] {
    return [...TEST_ACTIONS];
  }

  getParamSchema(action: string): ParamSchema[] {
    const common: ParamSchema[] = [
      {
        key: 'collectionPath',
        label: 'Collection path',
        type: 'text',
        isPath: true,
        pathType: 'directory',
        placeholder: '~/ansible_collections/namespace/collection',
        description: 'Path to run ansible-test from (must be collection root)',
        required: true,
      },
      {
        key: 'testTarget',
        label: 'Test target',
        type: 'text',
        placeholder: 'tests/unit/ or specific test file',
        description: 'Specific test target path',
      },
      {
        key: 'python',
        label: 'Python version',
        type: 'select',
        options: ['default', '3.10', '3.11', '3.12', '3.13'],
        defaultValue: 'default',
        description: 'Python version to use',
      },
      {
        key: 'verbosity',
        label: 'Verbosity',
        type: 'select',
        options: ['default', '-v', '-vv', '-vvv'],
        defaultValue: 'default',
      },
    ];

    if (action === 'sanity') {
      return [
        ...common,
        {
          key: 'testFilter',
          label: 'Sanity test filter',
          type: 'text',
          placeholder: 'pylint or pep8',
          description: 'Run only specific sanity test (e.g. pylint, pep8)',
        },
        {
          key: 'listTests',
          label: 'List available tests',
          type: 'checkbox',
          defaultValue: false,
          description: 'Print available sanity tests and exit',
        },
      ];
    }

    if (action === 'units' || action === 'integration') {
      return [
        ...common,
        {
          key: 'docker',
          label: 'Use Docker',
          type: 'checkbox',
          defaultValue: false,
          description: 'Run tests in Docker container',
        },
        {
          key: 'podman',
          label: 'Use Podman',
          type: 'checkbox',
          defaultValue: false,
          description: 'Run tests in Podman container',
        },
        {
          key: 'remote',
          label: 'Remote target',
          type: 'text',
          placeholder: 'remote_host',
          description: 'Run tests on remote target',
        },
        {
          key: 'requirements',
          label: 'Requirements file',
          type: 'file',
          placeholder: 'requirements.txt',
          description: 'Additional pip requirements',
        },
      ];
    }

    return common;
  }

  validate(params: ToolParams): ValidationError[] {
    const errors: ValidationError[] = [];
    if (!params['collectionPath']) {
      errors.push({ field: 'collectionPath', message: 'Collection path is required — ansible-test must run from the collection root' });
    }
    if (params['docker'] && params['podman']) {
      errors.push({ field: 'podman', message: 'Cannot use both Docker and Podman' });
    }
    return errors;
  }

  buildCommand(params: ToolParams): string[] {
    const cmd = ['ansible-test'];

    cmd.push(params.action as string);

    if (params['testTarget']) {
      cmd.push(params['testTarget'] as string);
    }

    if (params['python'] && params['python'] !== 'default') {
      cmd.push('--python', params['python'] as string);
    }
    if (params['verbosity'] && params['verbosity'] !== 'default') {
      cmd.push(params['verbosity'] as string);
    }
    if (params['listTests']) {
      cmd.push('--list-tests');
    }
    if (params['testFilter']) {
      cmd.push('--test', params['testFilter'] as string);
    }
    if (params['docker']) {
      cmd.push('--docker');
    }
    if (params['podman']) {
      cmd.push('--podman');
    }
    if (params['remote']) {
      cmd.push('--target', params['remote'] as string);
    }
    if (params['requirements']) {
      cmd.push('--requirements', params['requirements'] as string);
    }

    return cmd;
  }
}
