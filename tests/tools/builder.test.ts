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
        pull: 'missing',
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
        '--pull',
        'missing',
        '--container-runtime',
        'docker',
        '--build-context',
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
  });

  describe('validate', () => {
    it('returns error when definition is missing', () => {
      const errors = tool.validate({ action: 'create' });

      expect(errors).toHaveLength(1);
      expect(errors[0]?.field).toBe('definition');
    });
  });

  describe('getParamSchema', () => {
    it('returns build-specific fields for build action', () => {
      const schema = tool.getParamSchema('build');

      expect(schema.find((field) => field.key === 'buildContext')?.isPath).toBe(true);
      expect(schema.find((field) => field.key === 'verbosity')).toBeTruthy();
    });

    it('returns common schema for introspect action', () => {
      const schema = tool.getParamSchema('introspect');

      expect(schema).toHaveLength(1);
      expect(schema[0]?.key).toBe('definition');
    });
  });
});
