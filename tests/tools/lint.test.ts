import { describe, it, expect } from 'vitest';
import { LintTool } from '../../src/tools/lint.js';

describe('LintTool', () => {
  const tool = new LintTool();

  it('has correct name', () => {
    expect(tool.name).toBe('ansible-lint');
  });

  it('returns all actions', () => {
    expect(tool.getActions()).toEqual(['run', 'list-rules', 'list-tags']);
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
        '-x',
        'tests/,molecule/',
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

    it('builds list-rules command with profile and output format', () => {
      const cmd = tool.buildCommand({
        action: 'list-rules',
        profile: 'basic',
        outputFormat: 'codeclimate',
      });

      expect(cmd).toEqual(['ansible-lint', '--list-rules', '-p', 'basic', '-f', 'codeclimate']);
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
  });
});
