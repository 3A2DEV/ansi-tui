import { describe, it, expect } from 'vitest';
import { BuilderTool } from '../../src/tools/builder.js';

describe('BuilderTool', () => {
  const tool = new BuilderTool();

  it('has correct name', () => {
    expect(tool.name).toBe('ansible-builder');
  });

  it('returns all actions', () => {
    expect(tool.getActions()).toEqual(['build', 'create', 'introspect']);
  });

  describe('buildCommand', () => {
    it('builds build command with all supported options', () => {
      const cmd = tool.buildCommand({
        action: 'build',
        definition: 'execution-environment.yml',
        tag: 'my-ee:latest',
        containerRuntime: 'docker',
        buildContext: './context',
        verbosity: '-vv',
      });

      expect(cmd).toEqual([
        'ansible-builder',
        'build',
        '-f',
        'execution-environment.yml',
        '-t',
        'my-ee:latest',
        '--container-runtime',
        'docker',
        '-c',
        './context',
        '-vv',
      ]);
    });

    it('ignores default verbosity', () => {
      const cmd = tool.buildCommand({
        action: 'build',
        definition: 'execution-environment.yml',
        verbosity: 'default',
      });

      expect(cmd).not.toContain('default');
    });

    it('does not emit -t or --container-runtime for create action', () => {
      const cmd = tool.buildCommand({
        action: 'create',
        definition: 'execution-environment.yml',
        tag: 'my-ee:latest',
        containerRuntime: 'docker',
      });

      expect(cmd).toEqual(['ansible-builder', 'create', '-f', 'execution-environment.yml']);
    });

    it('emits -c and --output-filename for create action', () => {
      const cmd = tool.buildCommand({
        action: 'create',
        definition: 'execution-environment.yml',
        buildContext: './context',
        outputFilename: 'Containerfile',
      });

      expect(cmd).toEqual([
        'ansible-builder',
        'create',
        '-f',
        'execution-environment.yml',
        '-c',
        './context',
        '--output-filename',
        'Containerfile',
      ]);
    });

    it('pushes folder as positional for introspect', () => {
      const cmd = tool.buildCommand({
        action: 'introspect',
        folder: './context',
        userPip: 'requirements.txt',
      });

      expect(cmd).toEqual(['ansible-builder', 'introspect', '--user-pip', 'requirements.txt', './context']);
      expect(cmd).not.toContain('-f');
    });

    it('builds build command with cache, args, squash, output, and galaxy signature options', () => {
      const cmd = tool.buildCommand({
        action: 'build',
        definition: 'execution-environment.yml',
        noCache: true,
        buildArg: 'EE_BASE_IMAGE=quay.io/ansible/creator-ee:latest',
        pruneImages: true,
        squash: 'all',
        outputFilename: 'Dockerfile',
        galaxyKeyring: 'pubring.kbx',
        galaxyIgnoreSignatureCodes: 'NO_PUBKEY,FAILURE',
        galaxyRequiredValidSignatureCount: '1',
      });

      expect(cmd).toContain('--no-cache');
      expect(cmd).toContain('--build-arg');
      expect(cmd).toContain('--prune-images');
      expect(cmd).toContain('--squash');
      expect(cmd).toContain('--output-filename');
      expect(cmd).toContain('--galaxy-keyring');
      expect(cmd.filter((arg) => arg === '--galaxy-ignore-signature-status-codes')).toHaveLength(2);
      expect(cmd).toContain('--galaxy-required-valid-signature-count');
    });
  });

  describe('validate', () => {
    it('returns error when definition is missing', () => {
      const errors = tool.validate({ action: 'create' });

      expect(errors).toHaveLength(1);
      expect(errors[0]?.field).toBe('definition');
    });

    it('does not require definition for introspect', () => {
      expect(tool.validate({ action: 'introspect', folder: './context' })).toHaveLength(0);
    });
  });

  describe('getParamSchema', () => {
    it('returns build-specific fields for build action', () => {
      const schema = tool.getParamSchema('build');

      expect(schema.find((field) => field.key === 'buildContext')?.isPath).toBe(true);
      expect(schema.find((field) => field.key === 'verbosity')).toBeTruthy();
      expect(schema.find((field) => field.key === 'noCache')).toBeTruthy();
    });

    it('returns introspect-specific schema for introspect action', () => {
      const schema = tool.getParamSchema('introspect');

      expect(schema.find((field) => field.key === 'folder')?.required).toBe(true);
      expect(schema.find((field) => field.key === 'definition')).toBeUndefined();
    });
  });
});
