import { BaseTool } from './base.js';
import type { ToolParams, ValidationError, ParamSchema } from './base.js';

const BUILDER_ACTIONS = ['build', 'create', 'introspect'] as const;

export class BuilderTool extends BaseTool {
  readonly name = 'ansible-builder';

  getActions(): string[] {
    return [...BUILDER_ACTIONS];
  }

  getParamSchema(action: string): ParamSchema[] {
    const definitionParam: ParamSchema = {
      key: 'definition',
      label: 'Definition file',
      type: 'file',
      required: true,
      placeholder: 'execution-environment.yml',
      description: 'Path to execution environment definition file',
    };

    if (action === 'introspect') {
      return [
        {
          key: 'folder',
          label: 'Folder',
          type: 'text',
          isPath: true,
          pathType: 'directory',
          required: true,
          placeholder: '.',
          description: 'Project folder to introspect',
        },
        {
          key: 'userPip',
          label: 'User pip file',
          type: 'text',
          isPath: true,
          pathType: 'file',
          placeholder: 'requirements.txt',
          description: 'Additional pip requirements file',
        },
      ];
    }

    const common: ParamSchema[] = [
      definitionParam,
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
        {
          key: 'noCache',
          label: 'No cache',
          type: 'checkbox',
          defaultValue: false,
          description: 'Do not use cache when building the image',
        },
        {
          key: 'buildArg',
          label: 'Build arg',
          type: 'text',
          placeholder: 'KEY=value',
          description: 'Build-time variable to pass to the container runtime',
        },
        {
          key: 'pruneImages',
          label: 'Prune images',
          type: 'checkbox',
          defaultValue: false,
          description: 'Remove dangling images after building',
        },
        {
          key: 'squash',
          label: 'Squash',
          type: 'select',
          options: ['off', 'new', 'all'],
          defaultValue: 'off',
          description: 'Squash layers in the final image',
        },
        {
          key: 'outputFilename',
          label: 'Output filename',
          type: 'select',
          options: ['Containerfile', 'Dockerfile'],
          description: 'Container definition filename',
        },
        {
          key: 'galaxyKeyring',
          label: 'Galaxy keyring',
          type: 'text',
          isPath: true,
          pathType: 'file',
          placeholder: 'pubring.kbx',
          description: 'Keyring for Galaxy signature verification',
        },
        {
          key: 'galaxyIgnoreSignatureCodes',
          label: 'Ignore signature codes',
          type: 'text',
          placeholder: 'NO_PUBKEY,FAILURE',
          description: 'Signature status codes to ignore',
        },
        {
          key: 'galaxyRequiredValidSignatureCount',
          label: 'Required valid signatures',
          type: 'text',
          placeholder: '1',
          description: 'Required count of valid signatures',
        },
      ];
    }

    if (action === 'create') {
      return [
        ...common,
        {
          key: 'buildContext',
          label: 'Build context',
          type: 'text',
          isPath: true,
          pathType: 'directory',
          placeholder: './context',
          description: 'Directory to write build context into',
        },
        {
          key: 'outputFilename',
          label: 'Output filename',
          type: 'text',
          placeholder: 'Containerfile',
          description: 'Filename to write in the build context',
        },
      ];
    }

    return [definitionParam];
  }

  validate(params: ToolParams): ValidationError[] {
    const errors: ValidationError[] = [];
    if (params.action === 'introspect') {
      if (!params['folder']) {
        errors.push({ field: 'folder', message: 'Folder is required' });
      }
      return errors;
    }

    if (!params['definition']) {
      errors.push({ field: 'definition', message: 'Definition file is required' });
    }
    return errors;
  }

  buildCommand(params: ToolParams): string[] {
    const cmd = ['ansible-builder'];

    cmd.push(params.action as string);

    if (params.action === 'introspect') {
      if (params['userPip']) {
        cmd.push('--user-pip', params['userPip'] as string);
      }
      if (params['folder']) {
        cmd.push(params['folder'] as string);
      }
      return cmd;
    }

    if (params['definition']) {
      cmd.push('-f', params['definition'] as string);
    }
    if (params.action === 'build' && params['tag']) {
      cmd.push('-t', params['tag'] as string);
    }
    if (params.action === 'build' && params['containerRuntime']) {
      cmd.push('--container-runtime', params['containerRuntime'] as string);
    }
    if (params['buildContext']) {
      cmd.push('-c', params['buildContext'] as string);
    }
    if (params.action === 'create' && params['outputFilename']) {
      cmd.push('--output-filename', params['outputFilename'] as string);
    }
    if (params.action === 'build' && params['outputFilename']) {
      cmd.push('--output-filename', params['outputFilename'] as string);
    }
    if (params.action === 'build' && params['noCache']) {
      cmd.push('--no-cache');
    }
    if (params.action === 'build' && params['buildArg']) {
      cmd.push('--build-arg', params['buildArg'] as string);
    }
    if (params.action === 'build' && params['pruneImages']) {
      cmd.push('--prune-images');
    }
    if (params.action === 'build' && params['squash'] && params['squash'] !== 'off') {
      cmd.push('--squash', params['squash'] as string);
    }
    if (params.action === 'build' && params['galaxyKeyring']) {
      cmd.push('--galaxy-keyring', params['galaxyKeyring'] as string);
    }
    if (params.action === 'build' && params['galaxyIgnoreSignatureCodes']) {
      for (const code of (params['galaxyIgnoreSignatureCodes'] as string)
        .split(',')
        .map((value) => value.trim())
        .filter(Boolean)) {
        cmd.push('--galaxy-ignore-signature-status-codes', code);
      }
    }
    if (params.action === 'build' && params['galaxyRequiredValidSignatureCount']) {
      cmd.push('--galaxy-required-valid-signature-count', params['galaxyRequiredValidSignatureCount'] as string);
    }
    if (params['verbosity'] && params['verbosity'] !== 'default') {
      cmd.push(params['verbosity'] as string);
    }

    return cmd;
  }
}
