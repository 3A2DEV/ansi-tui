import { BaseTool } from './base.js';
import type { ToolParams, ValidationError, ParamSchema } from './base.js';

const LINT_ACTIONS = ['run', 'list-rules', 'list-tags'] as const;

export class LintTool extends BaseTool {
  readonly name = 'ansible-lint';

  getActions(): string[] {
    return [...LINT_ACTIONS];
  }

  getParamSchema(action: string): ParamSchema[] {
    if (action === 'list-rules' || action === 'list-tags') {
      return [
        {
          key: 'profile',
          label: 'Profile',
          type: 'select',
          options: ['basic', 'moderate', 'safety', 'shared', 'production'],
          description: 'Lint profile to filter rules',
        },
        {
          key: 'outputFormat',
          label: 'Output format',
          type: 'select',
          options: ['brief', 'full', 'json', 'codeclimate'],
          defaultValue: 'brief',
        },
      ];
    }

    return [
      {
        key: 'path',
        label: 'Path',
        type: 'text',
        isPath: true,
        pathType: 'any',
        required: true,
        placeholder: '.',
        description: 'Path to lint (file, directory, or playbook)',
      },
      {
        key: 'profile',
        label: 'Profile',
        type: 'select',
        options: ['basic', 'moderate', 'safety', 'shared', 'production'],
        description: 'Lint profile',
      },
      {
        key: 'rules',
        label: 'Rules dir',
        type: 'text',
        isPath: true,
        pathType: 'directory',
        placeholder: '~/.ansible-lint/rules',
        description: 'Custom rules directory',
      },
      {
        key: 'exclude',
        label: 'Exclude paths',
        type: 'text',
        placeholder: 'tests/,molecule/',
        description: 'Comma-separated paths to exclude',
      },
      {
        key: 'skipList',
        label: 'Skip rules',
        type: 'text',
        placeholder: 'yaml[line-length],no-changed-when',
        description: 'Comma-separated rule IDs to skip',
        },
      {
        key: 'fix',
        label: 'Auto-fix',
        type: 'checkbox',
        defaultValue: false,
        description: 'Attempt to auto-fix violations',
      },
      {
        key: 'outputFormat',
        label: 'Output format',
        type: 'select',
        options: ['brief', 'full', 'json', 'codeclimate', 'quiet'],
        defaultValue: 'brief',
        description: 'Output format',
      },
      {
        key: 'quiet',
        label: 'Quiet mode',
        type: 'checkbox',
        defaultValue: false,
        description: 'Only show failures',
      },
      {
        key: 'tags',
        label: 'Tags',
        type: 'text',
        placeholder: 'production,performance',
        description: 'Only run rules tagged with these tags',
      },
      {
        key: 'warnList',
        label: 'Warn rules',
        type: 'text',
        placeholder: 'experimental',
        description: 'Rule IDs to treat as warnings',
      },
    ];
  }

  validate(params: ToolParams): ValidationError[] {
    const errors: ValidationError[] = [];
    if (params.action === 'run' && !params['path']) {
      errors.push({ field: 'path', message: 'Path is required' });
    }
    return errors;
  }

  buildCommand(params: ToolParams): string[] {
    const cmd = ['ansible-lint'];

    if (params.action === 'list-rules') {
      cmd.push('--list-rules');
    } else if (params.action === 'list-tags') {
      cmd.push('--list-tags');
    }

    if (params['profile']) {
      cmd.push('-p', params['profile'] as string);
    }
    if (params['rules']) {
      cmd.push('-r', params['rules'] as string);
    }
    if (params['exclude']) {
      cmd.push('-x', params['exclude'] as string);
    }
    if (params['skipList']) {
      cmd.push('--skip-list', params['skipList'] as string);
    }
    if (params['fix']) {
      cmd.push('--fix');
    }
    if (params['outputFormat'] && params['outputFormat'] !== 'brief') {
      cmd.push('-f', params['outputFormat'] as string);
    }
    if (params['quiet']) {
      cmd.push('-q');
    }
    if (params['tags']) {
      cmd.push('-t', params['tags'] as string);
    }
    if (params['warnList']) {
      cmd.push('-w', params['warnList'] as string);
    }

    if (params.action === 'run' && params['path']) {
      cmd.push(params['path'] as string);
    }

    return cmd;
  }
}
