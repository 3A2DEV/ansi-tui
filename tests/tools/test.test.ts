import { describe, it, expect } from 'vitest';
import { TestTool } from '../../src/tools/test.js';

describe('TestTool', () => {
  const tool = new TestTool();

  describe('getActions()', () => {
    it('returns all supported ansible-test actions', () => {
      expect(tool.getActions()).toEqual([
        'units',
        'integration',
        'sanity',
        'coverage',
        'env',
        'shell',
        'network-integration',
        'windows-integration',
      ]);
    });
  });

  describe('getParamSchema()', () => {
    it('includes collectionPath for all actions', () => {
      for (const action of tool.getActions()) {
        expect(tool.getParamSchema(action).some((field) => field.key === 'collectionPath')).toBe(true);
      }
    });

    it('includes sanity-specific options', () => {
      const schema = tool.getParamSchema('sanity');
      expect(schema.some((field) => field.key === 'testFilter')).toBe(true);
      expect(schema.some((field) => field.key === 'listTests')).toBe(true);
      expect(schema.some((field) => field.key === 'skipTest')).toBe(true);
      expect(schema.some((field) => field.key === 'junit')).toBe(true);
      expect(schema.some((field) => field.key === 'local')).toBe(true);
      expect(schema.some((field) => field.key === 'containerMode')).toBe(false);
    });

    it('includes coverage options for coverage action', () => {
      const schema = tool.getParamSchema('coverage');
      expect(schema.some((field) => field.key === 'coverageAction')).toBe(true);
      expect(schema.some((field) => field.key === 'color')).toBe(true);
      expect(schema.some((field) => field.key === 'debug')).toBe(true);
      expect(schema.some((field) => field.key === 'testTarget')).toBe(false);
    });

    it('includes containerMode and dockerImage for units and integration-like actions', () => {
      for (const action of ['units', 'integration', 'network-integration', 'windows-integration', 'shell']) {
        const schema = tool.getParamSchema(action);
        expect(schema.some((field) => field.key === 'containerMode')).toBe(true);
        expect(schema.some((field) => field.key === 'dockerImage')).toBe(true);
      }
    });

    it('includes common coverage and debug options for units', () => {
      const schema = tool.getParamSchema('units');
      expect(schema.some((field) => field.key === 'coverage')).toBe(true);
      expect(schema.some((field) => field.key === 'changed')).toBe(true);
      expect(schema.some((field) => field.key === 'baseBranch')).toBe(true);
      expect(schema.some((field) => field.key === 'color')).toBe(true);
      expect(schema.some((field) => field.key === 'debug')).toBe(true);
    });

    it('does not include python for env action', () => {
      const schema = tool.getParamSchema('env');
      expect(schema.some((field) => field.key === 'python')).toBe(false);
    });
  });

  describe('buildCommand()', () => {
    it('builds basic sanity command without collectionPath in argv', () => {
      const command = tool.buildCommand({ action: 'sanity', collectionPath: '/path/to/col' });
      expect(command).toEqual(['ansible-test', 'sanity']);
      expect(command).not.toContain('/path/to/col');
    });

    it('builds sanity command with filters and common toggles', () => {
      const command = tool.buildCommand({
        action: 'sanity',
        collectionPath: '/path',
        testFilter: 'pylint',
        skipTest: 'validate-modules',
        allowDisabled: true,
        listTests: true,
        junit: true,
        lint: true,
        local: true,
        coverage: true,
        changed: true,
        baseBranch: 'main',
        color: 'yes',
        debug: true,
      });
      expect(command).toContain('--test');
      expect(command).toContain('--skip-test');
      expect(command).toContain('--allow-disabled');
      expect(command).toContain('--list-tests');
      expect(command).toContain('--junit');
      expect(command).toContain('--lint');
      expect(command).toContain('--local');
      expect(command).toContain('--coverage');
      expect(command).toContain('--changed');
      expect(command).toContain('--base-branch');
      expect(command).toContain('--color');
      expect(command).toContain('--debug');
    });

    it('builds units command with docker container mode', () => {
      const command = tool.buildCommand({ action: 'units', collectionPath: '/path', containerMode: 'docker', dockerImage: 'quay.io/example/test:latest' });
      expect(command).toEqual(['ansible-test', 'units', '--docker', 'quay.io/example/test:latest']);
    });

    it('builds shell command with venv container mode', () => {
      const command = tool.buildCommand({ action: 'shell', collectionPath: '/path', containerMode: 'venv' });
      expect(command).toEqual(['ansible-test', 'shell', '--venv']);
    });

    it('builds coverage command with coverage subcommand', () => {
      const command = tool.buildCommand({ action: 'coverage', collectionPath: '/path', coverageAction: 'html', color: 'auto', debug: true });
      expect(command).toEqual(['ansible-test', 'coverage', 'html', '--color', 'auto', '--debug']);
    });

    it('builds env command without test target argv', () => {
      const command = tool.buildCommand({ action: 'env', collectionPath: '/path', verbosity: '-v' });
      expect(command).toEqual(['ansible-test', 'env', '-v']);
    });

    it('ignores python for env action', () => {
      const command = tool.buildCommand({ action: 'env', collectionPath: '/path', verbosity: '-v', python: '3.12' });
      expect(command).toEqual(['ansible-test', 'env', '-v']);
    });

    it('builds integration command with target, remote, and common options', () => {
      const command = tool.buildCommand({
        action: 'integration',
        collectionPath: '/path',
        testTarget: 'tests/integration/targets/ping',
        remote: 'remote_host',
        requirements: 'requirements.txt',
        coverage: true,
        changed: true,
        baseBranch: 'main',
        color: 'no',
        debug: true,
      });
      expect(command).toContain('tests/integration/targets/ping');
      expect(command).toContain('--target');
      expect(command).toContain('remote_host');
      expect(command).toContain('--requirements');
      expect(command).toContain('--coverage');
      expect(command).toContain('--changed');
      expect(command).toContain('--base-branch');
      expect(command).toContain('--color');
      expect(command).toContain('--debug');
    });

    it('builds windows-integration command with test target', () => {
      const command = tool.buildCommand({ action: 'windows-integration', collectionPath: '/path', testTarget: 'tests/integration/targets/win_ping' });
      expect(command).toEqual(['ansible-test', 'windows-integration', 'tests/integration/targets/win_ping']);
    });

    it('does not add --python when python is default', () => {
      const command = tool.buildCommand({ action: 'units', collectionPath: '/path', python: 'default' });
      expect(command).not.toContain('--python');
    });

    it('does not add verbosity when verbosity is default', () => {
      const command = tool.buildCommand({ action: 'units', collectionPath: '/path', verbosity: 'default' });
      expect(command).not.toContain('default');
    });
  });

  describe('validate()', () => {
    it('returns error when collectionPath is empty', () => {
      const errors = tool.validate({ action: 'sanity', collectionPath: '' });
      expect(errors).toHaveLength(1);
      expect(errors[0]?.field).toBe('collectionPath');
    });

    it('returns no errors when collectionPath is set for sanity', () => {
      const errors = tool.validate({ action: 'sanity', collectionPath: '/path/to/collection' });
      expect(errors).toHaveLength(0);
    });

    it('returns no errors for env with collectionPath set', () => {
      expect(tool.validate({ action: 'env', collectionPath: '/path/to/collection' })).toHaveLength(0);
    });
  });
});
