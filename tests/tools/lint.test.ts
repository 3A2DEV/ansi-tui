import { describe, it, expect } from 'vitest';
import { LintTool } from '../../src/tools/lint.js';

describe('LintTool', () => {
  const tool = new LintTool();

  it('has correct name', () => {
    expect(tool.name).toBe('ansible-lint');
  });

  it('returns all actions', () => {
    expect(tool.getActions()).toEqual(['run', 'list-rules', 'list-tags', 'list-profiles']);
  });

  describe('buildCommand', () => {
    it('builds run command with configured flags', () => {
      const cmd = tool.buildCommand({
        action: 'run',
        path: '.',
        profile: 'production',
        rules: './rules',
        exclude: 'tests/,molecule/',
        skipList: 'yaml[line-length]',
        fix: true,
        quiet: true,
        tags: 'safety',
        warnList: 'experimental',
      });

      expect(cmd).toEqual([
        'ansible-lint',
        '-p',
        'production',
        '-r',
        './rules',
        '--exclude',
        'tests/',
        '--exclude',
        'molecule/',
        '--skip-list',
        'yaml[line-length]',
        '--fix',
        '-q',
        '-t',
        'safety',
        '-w',
        'experimental',
        '.',
      ]);
    });

    it('maps exclude to --exclude instead of -x', () => {
      const cmd = tool.buildCommand({ action: 'run', path: '.', exclude: 'tests/' });

      expect(cmd).toEqual(['ansible-lint', '--exclude', 'tests/', '.']);
      expect(cmd).not.toContain('-x');
    });

    it('does not emit --exclude when exclude is empty', () => {
      const cmd = tool.buildCommand({ action: 'run', path: '.', exclude: ' , ' });

      expect(cmd).toEqual(['ansible-lint', '.']);
    });

    it('builds list-rules command with profile and output format', () => {
      const cmd = tool.buildCommand({
        action: 'list-rules',
        profile: 'basic',
        outputFormat: 'codeclimate',
      });

      expect(cmd).toEqual(['ansible-lint', '--list-rules', '-p', 'basic', '-f', 'codeclimate']);
    });

    it('builds list-profiles command without params', () => {
      expect(tool.buildCommand({ action: 'list-profiles' })).toEqual(['ansible-lint', '--list-profiles']);
    });

    it('adds strict, config, ignore, project, enable, sarif, and offline flags', () => {
      const cmd = tool.buildCommand({
        action: 'run',
        path: '.',
        strict: true,
        configFile: '.ansible-lint',
        ignoreFile: '.ansible-lint-ignore',
        projectDir: '.',
        enableList: 'opt-in',
        sarifFile: 'ansible-lint.sarif',
        offline: true,
      });

      expect(cmd).toContain('-s');
      expect(cmd).toContain('-c');
      expect(cmd).toContain('-i');
      expect(cmd).toContain('--project-dir');
      expect(cmd).toContain('--enable-list');
      expect(cmd).toContain('--sarif-file');
      expect(cmd).toContain('--offline');
    });
  });

  describe('validate', () => {
    it('returns error when run path is missing', () => {
      const errors = tool.validate({ action: 'run' });

      expect(errors).toHaveLength(1);
      expect(errors[0]?.field).toBe('path');
    });

    it('returns no errors for list-tags without path', () => {
      expect(tool.validate({ action: 'list-tags' })).toHaveLength(0);
    });
  });

  describe('getParamSchema', () => {
    it('returns list-specific schema without path field', () => {
      const schema = tool.getParamSchema('list-tags');

      expect(schema.find((field) => field.key === 'profile')).toBeTruthy();
      expect(schema.find((field) => field.key === 'path')).toBeUndefined();
    });

    it('returns path field for run action', () => {
      const schema = tool.getParamSchema('run');

      expect(schema.find((field) => field.key === 'path')?.required).toBe(true);
    });

    it('returns empty schema for list-profiles action', () => {
      expect(tool.getParamSchema('list-profiles')).toEqual([]);
    });

    it('includes min profile and sarif output options', () => {
      const runSchema = tool.getParamSchema('run');
      const listSchema = tool.getParamSchema('list-tags');

      expect(runSchema.find((field) => field.key === 'profile')?.options).toContain('min');
      expect(listSchema.find((field) => field.key === 'outputFormat')?.options).toContain('sarif');
    });
  });
});
