import { BaseTool } from './base.js';
import type { ToolParams, ValidationError, ParamSchema } from './base.js';

const BUILDER_ACTIONS = ['build', 'create', 'introspect'] as const;

export class BuilderTool extends BaseTool {
  readonly name = 'ansible-builder';

  getActions(): string[] {
    return [...BUILDER_ACTIONS];
  }

  getParamSchema(action: string): ParamSchema[] {
    const common: ParamSchema[] = [
      {
        key: 'definition',
        label: 'Definition file',
        type: 'file',
        required: true,
        placeholder: 'execution-environment.yml',
        description: 'Path to execution environment definition file',
      },
    ];

    if (action === 'build') {
      return [
        ...common,
        {
          key: 'tag',
          label: 'Image tag',
          type: 'text',
          placeholder: 'my-ee:latest',
          description: 'Tag for the built container image',
        },
        {
          key: 'pull',
          label: 'Pull policy',
          type: 'select',
          options: ['always', 'missing', 'never', 'newer'],
          defaultValue: 'always',
          description: 'Policy for pulling base images',
        },
        {
          key: 'containerRuntime',
          label: 'Container runtime',
          type: 'select',
          options: ['docker', 'podman'],
          defaultValue: 'podman',
          description: 'Container runtime to use',
        },
        {
          key: 'buildContext',
          label: 'Build context',
          type: 'text',
          isPath: true,
          pathType: 'directory',
          placeholder: './context',
          description: 'Directory to use as build context',
        },
        {
          key: 'verbosity',
          label: 'Verbosity',
          type: 'select',
          options: ['default', '-v', '-vv', '-vvv'],
          defaultValue: 'default',
        },
      ];
    }

    if (action === 'create') {
      return [
        ...common,
        {
          key: 'tag',
          label: 'Image tag',
          type: 'text',
          placeholder: 'my-ee:latest',
        },
        {
          key: 'containerRuntime',
          label: 'Container runtime',
          type: 'select',
          options: ['docker', 'podman'],
          defaultValue: 'podman',
        },
      ];
    }

    return common;
  }

  validate(params: ToolParams): ValidationError[] {
    const errors: ValidationError[] = [];
    if (!params['definition']) {
      errors.push({ field: 'definition', message: 'Definition file is required' });
    }
    return errors;
  }

  buildCommand(params: ToolParams): string[] {
    const cmd = ['ansible-builder'];

    cmd.push(params.action as string);

    if (params['definition']) {
      cmd.push('-f', params['definition'] as string);
    }
    if (params['tag']) {
      cmd.push('-t', params['tag'] as string);
    }
    if (params['pull']) {
      cmd.push('--pull', params['pull'] as string);
    }
    if (params['containerRuntime']) {
      cmd.push('--container-runtime', params['containerRuntime'] as string);
    }
    if (params['buildContext']) {
      cmd.push('--build-context', params['buildContext'] as string);
    }
    if (params['verbosity'] && params['verbosity'] !== 'default') {
      cmd.push(params['verbosity'] as string);
    }

    return cmd;
  }
}
