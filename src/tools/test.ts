import { BaseTool } from './base.js';
import type { ToolParams, ValidationError, ParamSchema } from './base.js';

const TEST_ACTIONS = ['units', 'integration', 'sanity', 'coverage', 'env', 'shell', 'network-integration', 'windows-integration'] as const;

export class TestTool extends BaseTool {
  readonly name = 'ansible-test';

  getActions(): string[] {
    return [...TEST_ACTIONS];
  }

  getParamSchema(action: string): ParamSchema[] {
    const envCommon: ParamSchema[] = [
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
          key: 'verbosity',
          label: 'Verbosity',
          type: 'select',
          options: ['default', '-v', '-vv', '-vvv'],
          defaultValue: 'default',
        },
      ];

    const common: ParamSchema[] = [
      ...envCommon,
        {
          key: 'python',
          label: 'Python version',
          type: 'select',
          options: ['default', '3.10', '3.11', '3.12', '3.13'],
          defaultValue: 'default',
          description: 'Python version to use',
        },
      ];

    const testingCommon: ParamSchema[] = [
      ...common,
      {
        key: 'testTarget',
        label: 'Test target',
        type: 'text',
        placeholder: 'tests/unit/ or specific test file',
        description: 'Specific test target path',
      },
    ];

    if (action === 'sanity') {
      return [
        ...testingCommon,
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
        {
          key: 'skipTest',
          label: 'Skip test',
          type: 'text',
          placeholder: 'validate-modules',
          description: 'Specific sanity test to skip',
        },
        {
          key: 'allowDisabled',
          label: 'Allow disabled',
          type: 'checkbox',
          defaultValue: false,
          description: 'Allow disabled sanity tests to run',
        },
        {
          key: 'junit',
          label: 'JUnit',
          type: 'checkbox',
          defaultValue: false,
          description: 'Write failures to JUnit XML files',
        },
        {
          key: 'lint',
          label: 'Lint stdout',
          type: 'checkbox',
          defaultValue: false,
          description: 'Write lint output to stdout',
        },
        {
          key: 'local',
          label: 'Local env',
          type: 'checkbox',
          defaultValue: false,
          description: 'Run sanity tests in the local environment',
        },
      ];
    }

    if (action === 'coverage') {
      return [
        ...common,
        {
          key: 'coverageAction',
          label: 'Coverage action',
          type: 'select',
          options: ['analyze', 'erase', 'combine', 'report', 'html', 'xml'],
          defaultValue: 'report',
          description: 'Coverage subcommand to run',
        },
        {
          key: 'color',
          label: 'Color',
          type: 'select',
          options: ['default', 'yes', 'no', 'auto'],
          defaultValue: 'default',
          description: 'Color output mode',
        },
        {
          key: 'debug',
          label: 'Debug',
          type: 'checkbox',
          defaultValue: false,
          description: 'Run ansible-test in debug mode',
        },
      ];
    }

    if (action === 'shell') {
      return [
        ...common,
        {
          key: 'containerMode',
          label: 'Container mode',
          type: 'select',
          options: ['none', 'docker', 'venv', 'local'],
          defaultValue: 'none',
          description: 'Execution environment to use',
        },
        {
          key: 'dockerImage',
          label: 'Docker image',
          type: 'text',
          placeholder: 'quay.io/ansible/default-test-container:latest',
          description: 'Optional Docker image when using docker mode',
        },
        {
          key: 'coverage',
          label: 'Coverage',
          type: 'checkbox',
          defaultValue: false,
          description: 'Collect coverage data',
        },
        {
          key: 'changed',
          label: 'Changed only',
          type: 'checkbox',
          defaultValue: false,
          description: 'Limit work to changed targets',
        },
        {
          key: 'baseBranch',
          label: 'Base branch',
          type: 'text',
          placeholder: 'main',
          description: 'Base branch for change detection',
        },
        {
          key: 'color',
          label: 'Color',
          type: 'select',
          options: ['default', 'yes', 'no', 'auto'],
          defaultValue: 'default',
          description: 'Color output mode',
        },
        {
          key: 'debug',
          label: 'Debug',
          type: 'checkbox',
          defaultValue: false,
          description: 'Run ansible-test in debug mode',
        },
      ];
    }

    if (action === 'units' || action === 'integration' || action === 'network-integration' || action === 'windows-integration') {
      return [
        ...testingCommon,
        {
          key: 'containerMode',
          label: 'Container mode',
          type: 'select',
          options: ['none', 'docker', 'venv', 'local'],
          defaultValue: 'none',
          description: 'Execution environment to use',
        },
        {
          key: 'dockerImage',
          label: 'Docker image',
          type: 'text',
          placeholder: 'quay.io/ansible/default-test-container:latest',
          description: 'Optional Docker image when using docker mode',
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
        {
          key: 'coverage',
          label: 'Coverage',
          type: 'checkbox',
          defaultValue: false,
          description: 'Collect coverage data',
        },
        {
          key: 'changed',
          label: 'Changed only',
          type: 'checkbox',
          defaultValue: false,
          description: 'Limit work to changed targets',
        },
        {
          key: 'baseBranch',
          label: 'Base branch',
          type: 'text',
          placeholder: 'main',
          description: 'Base branch for change detection',
        },
        {
          key: 'color',
          label: 'Color',
          type: 'select',
          options: ['default', 'yes', 'no', 'auto'],
          defaultValue: 'default',
          description: 'Color output mode',
        },
        {
          key: 'debug',
          label: 'Debug',
          type: 'checkbox',
          defaultValue: false,
          description: 'Run ansible-test in debug mode',
        },
      ];
    }

    return envCommon;
  }

  validate(params: ToolParams): ValidationError[] {
    const errors: ValidationError[] = [];
    if (!params['collectionPath']) {
      errors.push({ field: 'collectionPath', message: 'Collection path is required — ansible-test must run from the collection root' });
    }
    return errors;
  }

  buildCommand(params: ToolParams): string[] {
    const cmd = ['ansible-test'];

    cmd.push(params.action as string);

    if (params.action === 'coverage' && params['coverageAction']) {
      cmd.push(params['coverageAction'] as string);
    }

    if (params['testTarget']) {
      cmd.push(params['testTarget'] as string);
    }

    if (params.action !== 'env' && params['python'] && params['python'] !== 'default') {
      cmd.push('--python', params['python'] as string);
    }
    if (params['verbosity'] && params['verbosity'] !== 'default') {
      cmd.push(params['verbosity'] as string);
    }
    if (params['coverage']) {
      cmd.push('--coverage');
    }
    if (params['changed']) {
      cmd.push('--changed');
    }
    if (params['baseBranch']) {
      cmd.push('--base-branch', params['baseBranch'] as string);
    }
    if (params['color'] && params['color'] !== 'default') {
      cmd.push('--color', params['color'] as string);
    }
    if (params['debug']) {
      cmd.push('--debug');
    }
    if (params['listTests']) {
      cmd.push('--list-tests');
    }
    if (params['testFilter']) {
      cmd.push('--test', params['testFilter'] as string);
    }
    if (params['skipTest']) {
      cmd.push('--skip-test', params['skipTest'] as string);
    }
    if (params['allowDisabled']) {
      cmd.push('--allow-disabled');
    }
    if (params['junit']) {
      cmd.push('--junit');
    }
    if (params['lint']) {
      cmd.push('--lint');
    }
    if (params['local']) {
      cmd.push('--local');
    }
    if (params['containerMode'] === 'docker') {
      cmd.push('--docker');
      if (params['dockerImage']) {
        cmd.push(params['dockerImage'] as string);
      }
    } else if (params['containerMode'] === 'venv') {
      cmd.push('--venv');
    } else if (params['containerMode'] === 'local') {
      cmd.push('--local');
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
